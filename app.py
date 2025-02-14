from flask import Flask, render_template, request, redirect, url_for, session, jsonify, make_response, flash
import mysql.connector
import pdfkit
import datetime

app = Flask(__name__)
app.secret_key = 'EHSM10'

# Connect to MySQL
def connect_db():
    return mysql.connector.connect(
        host="localhost",     # Your MySQL host
        user="root",          # Your MySQL username
        password="root",      # Your MySQL password
        database="exam_hall_db"  # Database name
    )

# Home Page
@app.route('/')
def home():
    return render_template('home.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        user_id = request.form['id']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        email = request.form['email']

        # Check if passwords match
        if password != confirm_password:
            return 'Passwords do not match!'

        # Connect to the database
        conn = connect_db()
        cursor = conn.cursor()

        # Insert the new user into the database (ensure to hash the password in a real application)
        try:
            cursor.execute('INSERT INTO users (id, password, email) VALUES (%s, %s, %s)', (user_id, password, email))
            conn.commit()
            return redirect(url_for('login'))  # Redirect to login after successful registration
        except mysql.connector.Error as err:
            return f"Error: {err}"
        finally:
            conn.close()

    return render_template('register.html')


# Login Page
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user_id = request.form['id']
        password = request.form['password']
        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id=%s AND password=%s', (user_id, password))
        user = cursor.fetchone()
        conn.close()
        if user:
            session['user_id'] = user[0]
            return redirect(url_for('home'))
        else:
            flash('Invalid credentials', 'error')
            return redirect(url_for('login'))
    return render_template('login.html')



@app.route('/room/<int:room_id>', methods=['GET'])
def room_selected(room_id):
    conn = connect_db()
    cursor = conn.cursor()

    # Fetch the room details by room_id
    cursor.execute('SELECT r.name, r.benches, r.seating_arrangement, b.name FROM rooms r JOIN buildings b ON r.building_id = b.id WHERE r.id = %s', 
                   (room_id,))
    room = cursor.fetchone()

    conn.close()

    return render_template('room_selected.html', room=room)

# Exam Schedule Page
@app.route('/exam', methods=['GET', 'POST'])
def exam():
    conn = connect_db()
    cursor = conn.cursor()

    if request.method == 'POST':
        # Handle delete request
        if 'delete' in request.form:
            exam_id = request.form['exam_id']
            cursor.execute('DELETE FROM exams WHERE id = %s', (exam_id,))
            conn.commit()

        # Handle update request
        elif 'update' in request.form:
            exam_id = request.form['exam_id']
            college_code = request.form['college_code']
            branch = request.form['branch']
            sem = request.form['sem']
            subject = request.form['subject']
            exam_date = request.form['exam_date']
            exam_time = request.form['exam_time']
            roll_start = request.form['roll_start']
            roll_end = request.form['roll_end']

            try:
                total_students = int(roll_end[-2:]) - int(roll_start[-2:]) + 1
            except ValueError:
                total_students = 0

            cursor.execute('''UPDATE exams 
                              SET college_code = %s, branch = %s, sem = %s, subject = %s, 
                                  exam_date = %s, exam_time = %s, roll_start = %s, roll_end = %s, total_students = %s 
                              WHERE id = %s''', 
                           (college_code, branch, sem, subject, exam_date, exam_time, roll_start, roll_end, total_students, exam_id))
            conn.commit()

        # Handle new exam creation
        else:
            college_code = request.form['college_code']
            branch = request.form['branch']
            sem = request.form['sem']
            subject = request.form['subject']
            exam_date = request.form['date']
            exam_time = request.form['time']
            roll_start = request.form['roll_start']
            roll_end = request.form['roll_end']

            try:
                total_students = int(roll_end[-2:]) - int(roll_start[-2:]) + 1
            except ValueError:
                total_students = 0

            cursor.execute('''INSERT INTO exams (college_code, branch, sem, subject, exam_date, exam_time, roll_start, roll_end, total_students) 
                              VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)''', 
                           (college_code, branch, sem, subject, exam_date, exam_time, roll_start, roll_end, total_students))
            conn.commit()

    # Fetch all exam schedules
    cursor.execute('SELECT * FROM exams')
    exam_schedules = cursor.fetchall()

    # Serialize datetime and timedelta objects to strings
    serialized_exams = []
    for exam in exam_schedules:
        serialized_exam = list(exam)
        serialized_exam[5] = exam[5].strftime('%Y-%m-%d')  # Convert `exam_date` to string

        # Convert `exam_time` (timedelta) to "HH:MM" format
        hours, remainder = divmod(exam[6].seconds, 3600)
        minutes = remainder // 60
        serialized_exam[6] = f"{hours:02}:{minutes:02}"

        serialized_exams.append(serialized_exam)

    conn.close()
    return render_template('exam.html', exam_schedules=serialized_exams)





@app.route('/seat-allocation', methods=['GET', 'POST'])
def seat_allocation():
    conn = connect_db()
    cursor = conn.cursor()

    # Get exams for the selection dropdown
    cursor.execute('SELECT DISTINCT branch, exam_date, exam_time FROM exams')
    exams = cursor.fetchall()

    if request.method == 'POST':
        selected_branch = request.form['branch']
        selected_date = request.form['date']
        selected_time = request.form['time']
        # Add logic for seat allocation based on selected values

    conn.close()
    return render_template('seat.html', exams=exams)




@app.route('/arrange_seats', methods=['POST'])
def arrange_seats():
    try:
        data = request.json
        selected_rows = data['selectedRows']
        arrangement_pattern = data['arrangementPattern']
        seatpattern = data['seatpattern']
        selected_rooms = data['selectedRooms']
        
        conn = connect_db()
        cursor = conn.cursor()
        seating_plan = {}
        allocated_rooms = set()

        if not selected_rooms:
            return jsonify({'error': 'No rooms selected'})

        room_placeholders = ', '.join(['%s'] * len(selected_rooms))

        # Initialize current_roll_tracker for single branch arrangement
        current_roll_tracker = None
        if not arrangement_pattern and len(selected_rows) == 1:
            cursor.execute('''
                SELECT roll_start, roll_end
                FROM exams
                WHERE branch = %s AND exam_date = %s AND exam_time = %s
            ''', (selected_rows[0]['branch'], selected_rows[0]['date'], selected_rows[0]['time']))
            exam = cursor.fetchone()
            if exam:
                current_roll_tracker = int(exam[0])
                roll_end_tracker = int(exam[1])

        # Collect all branch roll numbers for mixed arrangement
        branch_rolls = []
        if arrangement_pattern:
            for branch in selected_rows:
                cursor.execute('''
                    SELECT roll_start, roll_end
                    FROM exams
                    WHERE branch = %s AND exam_date = %s AND exam_time = %s
                ''', (branch['branch'], branch['date'], branch['time']))
                exam = cursor.fetchone()
                if exam:
                    roll_start = int(exam[0])
                    roll_end = int(exam[1])
                    branch_rolls.append({
                        'branch': branch['branch'],
                        'rolls': list(range(roll_start, roll_end + 1))
                    })

        # Get all rooms
        cursor.execute(f'''
            SELECT r.id, r.room_number, r.column_count, r.row_count, r.floor, b.name AS building_name
            FROM rooms r
            JOIN buildings b ON r.building_id = b.id
            WHERE r.room_number IN ({room_placeholders})
            ORDER BY b.name ASC, r.floor ASC, r.room_number ASC
        ''', selected_rooms)
        rooms = cursor.fetchall()

        for room in rooms:
            room_id = room[0]
            room_number = room[1]
            building_name = room[5]
            floor = room[4]

            if room_number in allocated_rooms:
                continue

            try:
                # Get room configuration
                query = f"SELECT `column_number`, `row_number` FROM room_{room_id}"
                cursor.execute(query)
                seat_config = cursor.fetchall()

                if not seat_config:
                    continue

                # Process room configuration
                column_rows = {}
                for col_num, row_num in seat_config:
                    if col_num not in column_rows:
                        column_rows[col_num] = 0
                    column_rows[col_num] = max(column_rows[col_num], row_num)

                max_cols = max(col for col, _ in seat_config)
                max_rows = max(row for _, row in seat_config)
                valid_seats = set((col-1, row-1) for col, row in seat_config)

                # Initialize seating array
                room_seating = [[None for _ in range(max_cols)] for _ in range(max_rows)]

                if not arrangement_pattern:
                    # Single branch arrangement with continuous roll numbers
                    if current_roll_tracker and current_roll_tracker <= roll_end_tracker:
                        if seatpattern == "side":
                            # Fill by row
                            for row in range(max_rows):
                                for col in range(max_cols):
                                    if (col, row) in valid_seats and current_roll_tracker <= roll_end_tracker:
                                        room_seating[row][col] = current_roll_tracker
                                        current_roll_tracker += 1
                        else:
                            # Fill by column
                            for col in range(max_cols):
                                if col + 1 in column_rows:
                                    for row in range(column_rows[col + 1]):
                                        if current_roll_tracker <= roll_end_tracker:
                                            room_seating[row][col] = current_roll_tracker
                                            current_roll_tracker += 1
                else:
                    # Mixed arrangement - alternate branches by column
                    for col in range(max_cols):
                        if not branch_rolls:  # No more students to allocate
                            break
                            
                        branch_index = col % len(branch_rolls)
                        current_branch = branch_rolls[branch_index]
                        
                        if col + 1 in column_rows:
                            for row in range(column_rows[col + 1]):
                                if current_branch['rolls']:
                                    room_seating[row][col] = current_branch['rolls'].pop(0)

                # Add room to seating plan
                if building_name not in seating_plan:
                    seating_plan[building_name] = {}
                if floor not in seating_plan[building_name]:
                    seating_plan[building_name][floor] = []

                room_data = {
                    'room_number': room_number,
                    'seating': room_seating,
                    'valid_seats': list(valid_seats),
                    'column_rows': column_rows
                }

                # Add branch information
                if arrangement_pattern:
                    for i, branch in enumerate(branch_rolls):
                        room_data[f'branch{i+1}'] = branch['branch']
                else:
                    room_data['branch'] = selected_rows[0]['branch']

                seating_plan[building_name][floor].append(room_data)
                allocated_rooms.add(room_number)

            except Exception as e:
                print(f"Error processing room {room_number} (ID: {room_id}): {str(e)}")
                continue

        conn.close()
        return jsonify(seating_plan)
        
    except Exception as e:
        print(f"Error in arrange_seats: {str(e)}")
        return jsonify({'error': str(e)}), 500
    

def alternate_branch_seating(seating_plan, branches):
    branch_rolls = []
    new_seating_plan = {}

    # Collect roll numbers for each branch
    for branch in branches:
        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT roll_start, roll_end
            FROM exams
            WHERE branch = %s AND exam_date = %s AND exam_time = %s
        ''', (branch['branch'], branch['date'], branch['time']))
        exam = cursor.fetchone()
        if exam:
            roll_start = int(exam[0])
            roll_end = int(exam[1])
            branch_rolls.append({
                'branch': branch['branch'],
                'rolls': list(range(roll_start, roll_end + 1))
            })
        conn.close()

    for building, floors in seating_plan.items():
        new_seating_plan[building] = {}
        for floor, rooms in floors.items():
            new_seating_plan[building][floor] = []
            for room in rooms:
                valid_seats = room['valid_seats']
                column_rows = room['column_rows']
                max_rows = max(row + 1 for _, row in valid_seats)
                max_cols = max(col + 1 for col, _ in valid_seats)
                
                # Initialize seating array
                new_room_seating = [[None for _ in range(max_cols)] for _ in range(max_rows)]
                
                # Distribute branches across columns
                for col in range(max_cols):
                    branch_index = col % len(branch_rolls) if branch_rolls else 0
                    if branch_index < len(branch_rolls):
                        current_branch = branch_rolls[branch_index]
                        
                        # Get the row count for this column
                        row_count = column_rows.get(col + 1, 0)
                        
                        # Fill seats in this column
                        for row in range(row_count):
                            if current_branch['rolls']:
                                if (col, row) in valid_seats:
                                    new_room_seating[row][col] = current_branch['rolls'].pop(0)

                room_data = {
                    'room_number': room['room_number'],
                    'seating': new_room_seating,
                    'valid_seats': valid_seats,
                    'column_rows': column_rows
                }

                # Add branch information
                for i, branch in enumerate(branch_rolls):
                    room_data[f'branch{i+1}'] = branch['branch']

                new_seating_plan[building][floor].append(room_data)

    return new_seating_plan










@app.route('/get_dates/<branch>', methods=['GET'])
def get_dates(branch):
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT exam_date FROM exams WHERE branch = %s', (branch,))
    dates = cursor.fetchall()
    conn.close()
    return jsonify(dates)

@app.route('/get_times/<branch>/<date>', methods=['GET'])
def get_times(branch, date):
    
    conn = connect_db()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT DISTINCT exam_time FROM exams WHERE branch = %s AND exam_date = %s', (branch, date))
        times = cursor.fetchall()
    except Exception as e:
        print("Error executing query:", e)
        return jsonify({"error": "Database error occurred."}), 500
    finally:
        conn.close()

    # Process the fetched times
    times_list = []
    for time in times:
        # Convert timedelta to total seconds
        total_seconds = int(time[0].total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        formatted_time = f"{hours:02}:{minutes:02}:{seconds:02}"  # Format as HH:MM:SS
        times_list.append(formatted_time)

    if not times_list:
        print("No times found for the given branch and date.")
    return jsonify(times_list)






@app.route('/api/get_rooms', methods=['GET'])
def get_rooms():
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            r.id AS room_id,
            b.id AS building_id,
            b.name AS building_name,
            r.floor,
            r.room_number,
            r.total_seats
        FROM rooms r
        JOIN buildings b ON r.building_id = b.id
    """)
    
    rooms = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(rooms)







@app.route('/get_total_seats', methods=['GET'])
def get_total_seats():
        conn = connect_db()  # Function to connect to the database
        cursor = conn.cursor(dictionary=True)

        # Query to get the total number of seats across all rooms
        cursor.execute("""
            SELECT SUM(r.total_seats) AS total_seats
            FROM rooms r
        """)
        result = cursor.fetchone()
        total_seats = result['total_seats'] if result else 0

        cursor.close()
        conn.close()

        # Return the total number of seats
        return jsonify({'total_seats': total_seats})






@app.route('/get_total_students/<branch>/<date>/<time>', methods=['GET'])
def get_total_students(branch, date, time):
    conn = connect_db()  # Function to connect to the database
    cursor = conn.cursor()
    # Fetch total students based on branch, date, and time from the exams table
    query = """
        SELECT total_students FROM exams
        WHERE branch = %s AND exam_date = %s AND exam_time = %s
    """
    cursor.execute(query, (branch, date, time))
    result = cursor.fetchone()

    if result:
        total_students = result[0]
    else:
        total_students = 0

    return jsonify({'total_students': total_students})






@app.route('/room', methods=['GET', 'POST'])
def room():
    conn = connect_db()
    cursor = conn.cursor()
    print(request.form)
    if request.method == 'POST':
        # Check if we are adding a new building
        if 'add_building' in request.form:
            building_name = request.form['building_name']
            try:
                # Insert the new building into the buildings table
                cursor.execute(''' 
                    INSERT INTO buildings (name) 
                    VALUES (%s)
                ''', (building_name,))
                conn.commit()
                flash('Building added successfully!', 'success')  # Provide feedback
            except Exception as e:
                conn.rollback()  # Rollback in case of error
                flash(f'Error adding building: {str(e)}', 'error')  # Provide error feedback

        # Check if we are editing an existing room
        elif 'edit' in request.form:
            room_id = request.form['room_id']
            room_number = request.form['room_number']
            floor = int(request.form['floor'])
            column_count = int(request.form['column_count'])

            # Calculate row_count and total_seats
            row_count = 0
            total_seats = 0

            # Loop through each column to get the row counts
            for i in range(1, column_count + 1):
                column_row_count = int(request.form[f'column_row_count_{i}'])
                row_count = max(row_count, column_row_count)  # Update row_count to the maximum
                total_seats += column_row_count  # Add to total_seats

            # Drop the existing room's table
            room_table_name = f"room_{room_id}"
            cursor.execute(f"DROP TABLE IF EXISTS {room_table_name}")

            # Update the room details in the rooms table
            cursor.execute(''' 
                UPDATE rooms 
                SET room_number = %s, floor = %s, column_count = %s, row_count = %s, total_seats = %s 
                WHERE id = %s
            ''', (room_number, floor, column_count, row_count, total_seats, room_id))
            conn.commit()

            # Create a new table for the room after updating
            cursor.execute(f'''
                CREATE TABLE {room_table_name} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    column_number INT,
                    `row_number` INT,  -- Use backticks to escape the reserved keyword
                    seat_status INT DEFAULT 0
                )
            ''')

            # Initialize the new room's seats
            for column in range(1, column_count + 1):
                column_row_count = int(request.form[f'column_row_count_{column}'])  # Get the row count for this column
                for row in range(1, column_row_count + 1):
                    cursor.execute(f'''
                        INSERT INTO {room_table_name} (column_number, `row_number`, seat_status) 
                        VALUES (%s, %s, %s)
                    ''', (column, row, 0))  # Initialize seat status to 0 (empty)

            conn.commit()

        else:
            # Adding a new room
            building_id = request.form['building_id']
            room_number = request.form['room_number']
            floor = int(request.form['floor'])
            column_count = int(request.form['column_count'])

            # Initialize total seats and row counts
            total_seats = 0
            column_row_counts = []

            # Collect the total rows for each column
            for i in range(1, column_count + 1):
                column_row_count = int(request.form[f'column_row_count_{i}'])
                column_row_counts.append(column_row_count)
                total_seats += column_row_count  # Assuming 1 seat per row for simplicity

            # Insert the room data into the rooms table
            cursor.execute(''' 
                INSERT INTO rooms (building_id, room_number, column_count, row_count, total_seats, floor) 
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (building_id, room_number, column_count, max(column_row_counts), total_seats, floor))
            conn.commit()

            # Get the last inserted room ID
            room_id = cursor.lastrowid

            # Create a new table for the room
            room_table_name = f"room_{room_id}"  # Example: room_1, room_2, etc.
            cursor.execute(f'''
                CREATE TABLE {room_table_name} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    column_number INT,
                    `row_number` INT,  -- Use backticks to escape the reserved keyword
                    seat_status INT DEFAULT 0
                )
            ''')

            # Insert rows into the room's table
            for column in range(1, column_count + 1):
                column_row_count = column_row_counts[column - 1]  # Get the row count for this column
                for row in range(1, column_row_count + 1):
                    cursor.execute(f'''
                        INSERT INTO {room_table_name} (column_number, `row_number`, seat_status) 
                        VALUES (%s, %s, %s)
                    ''', (column, row, 0))  # Initialize seat status to 0 (empty)

            conn.commit()

    # Retrieve all buildings and rooms
    cursor.execute('SELECT * FROM buildings')
    buildings = cursor.fetchall()

    cursor.execute(''' 
        SELECT r.id, r.room_number, r.column_count, r.row_count, r.total_seats, r.floor, r.building_id 
        FROM rooms r JOIN buildings b ON r.building_id = b.id
    ''')
    rooms = cursor.fetchall()

    conn.close()

    return render_template('room.html', buildings=buildings, rooms=rooms)


@app.route('/delete_room', methods=['POST'])
def delete_room():
    room_id = request.form['room_id']
    
    # First, drop the room's table
    room_table_name = f"room_{room_id}"
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"DROP TABLE IF EXISTS {room_table_name}")
        # Now delete the room from the rooms table
        cursor.execute("DELETE FROM rooms WHERE id = %s", (room_id,))
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('room'))  # Redirect back to the room management page





@app.route('/get_room_details/<int:room_id>')
def get_room_details(room_id):
    try:
        conn = connect_db()
        cursor = conn.cursor(dictionary=True)

        # Get basic room details
        cursor.execute("""
            SELECT r.id, r.room_number, r.floor, r.total_seats, r.column_count, r.row_count,
                   b.name as building_name
            FROM rooms r
            LEFT JOIN buildings b ON r.building_id = b.id
            WHERE r.id = %s
        """, (room_id,))
        
        room_basic = cursor.fetchone()
        
        if not room_basic:
            return jsonify({'error': 'Room not found'}), 404

        # Get seat layout from room specific table
        query = """
            SELECT id, `column_number`, `row_number`, seat_status 
            FROM room_{0}
            ORDER BY `column_number`, `row_number`
        """.format(room_id)  # Format the room_id into the query
        
        cursor.execute(query)
        seats = cursor.fetchall()

        # Process the data
        room_details = {
            'room_number': room_basic['room_number'],
            'floor': room_basic['floor'],
            'total_seats': room_basic['total_seats'],
            'building_name': room_basic['building_name'],
            'columns': {}
        }

        # Organize seats by column
        for seat in seats:
            col_num = seat['column_number']
            if col_num not in room_details['columns']:
                room_details['columns'][col_num] = {
                    'row_count': 0,
                    'seats': []
                }
            room_details['columns'][col_num]['seats'].append({
                'row': seat['row_number'],
                'status': seat['seat_status']
            })
            room_details['columns'][col_num]['row_count'] = len(room_details['columns'][col_num]['seats'])

        cursor.close()
        conn.close()

        return jsonify(room_details)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500
    


@app.route('/update_room', methods=['POST'])
def update_room():
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        room_id = request.form.get('room_id')
        building_id = request.form.get('building_id')
        room_number = request.form.get('room_number')
        floor = int(request.form.get('floor'))
        column_count = int(request.form.get('column_count'))
        row_count = int(request.form.get('row_count'))
        total_seats = column_count * row_count

        # Update the room details in the rooms table
        cursor.execute('''
            UPDATE rooms 
            SET building_id = %s,
                room_number = %s, 
                floor = %s, 
                column_count = %s, 
                row_count = %s, 
                total_seats = %s
            WHERE id = %s
        ''', (building_id, room_number, floor, column_count, row_count, total_seats, room_id))

        # Drop the existing room's table
        room_table_name = f"room_{room_id}"
        cursor.execute(f"DROP TABLE IF EXISTS {room_table_name}")

        # Create a new table for the room
        cursor.execute(f'''
            CREATE TABLE {room_table_name} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                column_number INT,
                `row_number` INT,
                seat_status INT DEFAULT 0
            )
        ''')

        # Insert new seats
        for col in range(1, column_count + 1):
            for row in range(1, row_count + 1):
                cursor.execute(f'''
                    INSERT INTO {room_table_name} 
                    (column_number, `row_number`, seat_status)
                    VALUES (%s, %s, %s)
                ''', (col, row, 0))

        conn.commit()
        flash('Room updated successfully!', 'success')

    except Exception as e:
        conn.rollback()
        flash(f'Error updating room: {str(e)}', 'error')
    finally:
        conn.close()

    return redirect(url_for('room'))


@app.route("/update_exam", methods=["POST"])
def update_exam():
    data = request.json
    exam_id = data["id"]
    # Extract other fields from the request
    fields = (
        data["college_code"],
        data["branch"],
        data["sem"],
        data["subject"],
        data["exam_date"],
        data["exam_time"],
        data["roll_start"],
        data["roll_end"],
        data["total_students"],
        exam_id,
    )
    query = """
        UPDATE exams
        SET college_code = %s, branch = %s, sem = %s, subject = %s,
            exam_date = %s, exam_time = %s, roll_start = %s, roll_end = %s, total_students = %s
        WHERE id = %s
    """
    cursor.execute(query, fields)
    db.commit()
    return jsonify({"success": True})





@app.route('/seat_pdf.html')
def seat_pdf():
    return render_template('seat_pdf.html')


# Logout
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(port=80,debug=True)
