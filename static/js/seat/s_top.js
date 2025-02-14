async function loadDates() {
    const branch = document.querySelector('select[name="branch"]').value;
    const response = await fetch(`/get_dates/${branch}`);
    const dates = await response.json();
    const dateSelect = document.querySelector('select[name="date"]');
    dateSelect.innerHTML = '<option value="">Select Date</option>'; // Reset date options
    dates.forEach((date) => {
      const formattedDate = new Date(date[0]).toISOString().split("T")[0]; // Format to YYYY-MM-DD
      const option = document.createElement("option");
      option.value = formattedDate; // Use formatted date
      option.textContent = formattedDate; // Option text can remain as is or formatted
      dateSelect.appendChild(option);
    });
    loadTimes(); // Load times based on the new selection
  }

  async function loadTimes() {
    const branch = document.querySelector('select[name="branch"]').value;
    const date = document.querySelector('select[name="date"]').value;

    // Check if both branch and date are selected
    if (!branch || !date) {
      return; // If either is not selected, do not attempt to load times
    }

    const response = await fetch(`/get_times/${branch}/${date}`);
    const times = await response.json();
    const timeSelect = document.querySelector('select[name="time"]');
    timeSelect.innerHTML = '<option value="">Select Time</option>'; // Reset time options
    times.forEach((time) => {
      const option = document.createElement("option");
      option.value = time; // Assuming time is the first element in the tuple
      option.textContent = time; // Display time
      timeSelect.appendChild(option);
    });
  }

  async function arrangeSeats() {
    // Get selected rows from the table
    const selectedRows = [];
    const checkboxes = document.querySelectorAll('#allocatedSeatsTable tbody input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        selectedRows.push({
            branch: row.cells[1].textContent,
            date: row.cells[2].textContent,
            time: row.cells[3].textContent
        });
    });

    // Get selected rooms
    const selectedRoomElements = document.querySelectorAll('#roomContainer input[type="checkbox"]:checked');
    const selectedRooms = Array.from(selectedRoomElements).map(el => el.value);

    // Get arrangement pattern
    const arrangementPattern = document.getElementById('arrangementPattern').checked;

    // Get seat pattern
    const seatpattern = document.getElementById('seatpattern').value;

    // Validate selections
    if (selectedRows.length === 0) {
        alert('Please select at least one branch');
        return;
    }

    if (selectedRooms.length === 0) {
        alert('Please select at least one room');
        return;
    }

    try {
        const response = await fetch('/arrange_seats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrf_token')  // If you're using CSRF protection
            },
            body: JSON.stringify({
                selectedRows: selectedRows,
                arrangementPattern: arrangementPattern,
                seatpattern: seatpattern,
                selectedRooms: selectedRooms
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const seatingPlan = await response.json();
        renderSeatingPlan(seatingPlan);
        
        // Optionally scroll to the visualization
        document.getElementById('seating-plan').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error:', error);
        alert('Error generating seating plan: ' + error.message);
    }
}

// Helper function to get CSRF token if you're using it
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Add debug logging
function debugSeatingPlan(seatingPlan) {
    console.log('Seating Plan Data:', seatingPlan);
}

function renderSeatingPlan(seatingPlan) {
  console.log('Rendering seating plan:', seatingPlan);
  const container = document.getElementById('seating-plan');
  if (!container) {
      console.error('Seating plan container not found');
      return;
  }
  
  container.innerHTML = '';
  
  if (!seatingPlan || Object.keys(seatingPlan).length === 0) {
      container.innerHTML = '<p>No seating plan data available</p>';
      return;
  }

  try {
      for (const [building, floors] of Object.entries(seatingPlan)) {
          const buildingDiv = document.createElement('div');
          buildingDiv.innerHTML = `<h2>${building}</h2>`;

          for (const [floor, rooms] of Object.entries(floors)) {
              const floorDiv = document.createElement('div');
              floorDiv.innerHTML = `<h3>Floor ${floor}</h3>`;

              rooms.forEach(room => {
                  const roomDiv = document.createElement('div');
                  roomDiv.className = 'room-container';
                  
                  // Create room header
                  const headerDiv = document.createElement('div');
                  headerDiv.className = 'room-header';
                  headerDiv.innerHTML = `<h4>Room ${room.room_number}</h4>`;

                  // Add legend for branches
                  const legendDiv = document.createElement('div');
                  legendDiv.className = 'legend';
                  Object.entries(room).forEach(([key, value]) => {
                      if (key.startsWith('branch')) {
                          legendDiv.innerHTML += `
                              <div class="legend-item">
                                  <span>${key}: ${value}</span>
                              </div>`;
                      }
                  });
                  headerDiv.appendChild(legendDiv);
                  roomDiv.appendChild(headerDiv);

                  // Render seats
                  const seatingDiv = document.createElement('div');
                  room.seating.forEach((row, rowIndex) => {
                      const rowDiv = document.createElement('div');
                      rowDiv.className = 'row';

                      row.forEach((seat, colIndex) => {
                          const seatDiv = document.createElement('div');
                          // Check if this position should have a seat
                          const isValidSeat = room.valid_seats.some(([col, row]) => 
                              col === colIndex && row === rowIndex);

                          if (!isValidSeat) {
                              seatDiv.className = 'seat invalid';
                              seatDiv.style.visibility = 'hidden'; // Hide invalid seats
                          } else if (seat) {
                              seatDiv.className = 'seat occupied';
                              seatDiv.textContent = seat;
                          } else {
                              seatDiv.className = 'seat empty';
                          }
                          rowDiv.appendChild(seatDiv);
                      });
                      seatingDiv.appendChild(rowDiv);
                  });
                  roomDiv.appendChild(seatingDiv);
                  floorDiv.appendChild(roomDiv);
              });
              buildingDiv.appendChild(floorDiv);
          }
          container.appendChild(buildingDiv);
      }
  } catch (error) {
      console.error('Error rendering seating plan:', error);
      container.innerHTML = `<p>Error rendering seating plan: ${error.message}</p>`;
  }
}


function visualizeSeating(data, arrangementPattern) {
const visualizationContainer = document.getElementById("visualizationContainer");
visualizationContainer.innerHTML = ""; // Clear previous visualization

// Iterate over each building in the hierarchical structure
for (const buildingName in data) {
    const buildingDiv = document.createElement("div");
    buildingDiv.className = "building"; // Class for building styling
    buildingDiv.innerHTML = `<h3>Building: ${buildingName}</h3>`;

    const floors = data[buildingName];

    // Iterate over each floor in the building
    for (const floor in floors) {
        const floorDiv = document.createElement("div");
        floorDiv.className = "floor"; // Class for floor styling
        floorDiv.innerHTML = `<h4>Floor: ${floor}</h4>`;

        const rooms = floors[floor];

        // Iterate over each room in the floor
        rooms.forEach((room) => {
            const roomDiv = document.createElement("div");
            roomDiv.className = "room"; // Class for room styling
            roomDiv.innerHTML = `<h5>Room: ${room.room_number}</h5>`;

            const table = document.createElement("table");
            table.className = "seating-table"; // Class for table styling
            const thead = document.createElement("thead");
            const tbody = document.createElement("tbody");

            // Check if seating information exists
            if (!room.seating || !Array.isArray(room.seating)) {
                console.error("Seating data is missing or not an array:", room);
                return; // Exit the current room processing
            }

            // Get the number of columns based on the first row of seating
            const seatColumns = room.seating[0].length; // Ensure that room.seating[0] exists

            // Create a header row with branch names based on the arrangement pattern
            const headerRow = document.createElement("tr");
            if (arrangementPattern) {
                // If arrangement pattern is enabled, use branch1 and branch2
                if (room.branch1 && room.branch2) {
                    for (let col = 0; col < seatColumns; col++) {
                        const branchHeader = document.createElement("th");
                        branchHeader.textContent = col % 2 === 0 ? room.branch1 : room.branch2; // Use actual branch names
                        headerRow.appendChild(branchHeader);
                    }
                } else {
                    console.error("Branch information is missing for room:", room);
                    return; // Exit the current room processing
                }
            } else {
                // If arrangement pattern is not enabled, show the same branch name
                if (room.branch) {
                    for (let col = 0; col < seatColumns; col++) {
                        const branchHeader = document.createElement("th");
                        branchHeader.textContent = room.branch; // Set the branch name
                        headerRow.appendChild(branchHeader);
                    }
                } else {
                    console.error("Branch information is missing for room:", room);
                    return; // Exit the current room processing
                }
            }

            thead.appendChild(headerRow); // Append the header row to thead
            table.appendChild(thead); // Append thead to the table

            // Create seating rows
            room.seating.forEach((seatRow) => {
                const tr = document.createElement("tr");
                seatRow.forEach((seat) => {
                    const td = document.createElement("td");
                    td.textContent = seat !== null ? seat : "Empty"; // Display roll number or 'Empty'
                    td.className = seat !== null ? `occupied ${room.branch1 || room.branch}` : "empty"; // Class for styling
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });

            table.appendChild(tbody); // Append tbody to the table
            roomDiv.appendChild(table); // Append table to roomDiv
            floorDiv.appendChild(roomDiv); // Append roomDiv to floorDiv
        });

        buildingDiv.appendChild(floorDiv); // Append floorDiv to buildingDiv
    }

    visualizationContainer.appendChild(buildingDiv); // Append buildingDiv to the main container
}
}