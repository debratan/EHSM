document
  .getElementById("allocateButton")
  .addEventListener("click", function () {
    const branch = document.getElementById("branch").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    // Validate inputs
    if (!branch || !date || !time) {
      alert("Please select branch, date, and time.");
      return;
    }

    // Create a new row
    const tableBody = document
      .getElementById("allocatedSeatsTable")
      .getElementsByTagName("tbody")[0];
    const newRow = tableBody.insertRow();

    // Insert cells and fill them with selected values
    const selectCell = newRow.insertCell(0);
    const branchCell = newRow.insertCell(1);
    const dateCell = newRow.insertCell(2);
    const timeCell = newRow.insertCell(3);
    const actionCell = newRow.insertCell(4);

    // Add checkbox for selection
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    selectCell.appendChild(checkbox);

    // Fill in the rest of the cells
    branchCell.textContent = branch;
    dateCell.textContent = date;
    timeCell.textContent = time;

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function () {
      tableBody.deleteRow(newRow.rowIndex - 1); // -1 to account for the header row
    };
    actionCell.appendChild(deleteButton);

    // Clear selections after allocation
    document.getElementById("branch").value = "";
    document.getElementById("date").value = "";
    document.getElementById("time").value = "";
    document.getElementById("arrangementPattern").checked = false; // Reset checkbox
  });








async function fetchRoomData() {
  try {
    const response = await fetch("/api/get_rooms"); // Adjust this URL to your API endpoint
    const data = await response.json();
    visualizeRooms(data);
  } catch (error) {
    console.error("Error fetching room data:", error);
  }
}

// Function to visualize rooms and attach event listeners for seat selection
function visualizeRooms(data) {
  const roomContainer = document.getElementById("roomContainer");
  roomContainer.innerHTML = ""; // Clear previous content

  let totalAllocatedSeats = 0; // Variable to track the total allocated seats
  let totalSeats = 0; // Track total available seats in all rooms

  const buildingsMap = {}; // Use a map to organize buildings by their IDs

  // Organizing data by buildings and floors
  data.forEach((room) => {
    const {
      building_id,
      building_name,
      floor,
      room_number,
      total_seats,
    } = room;

    if (!buildingsMap[building_id]) {
      buildingsMap[building_id] = {
        name: building_name,
        floors: {},
      };
    }

    if (!buildingsMap[building_id].floors[floor]) {
      buildingsMap[building_id].floors[floor] = [];
    }

    buildingsMap[building_id].floors[floor].push({
      room_number,
      total_seats,
    });

    totalSeats += total_seats; // Track the total number of seats in all rooms
  });

  // Create the building, floor, and room structure
  for (const buildingId in buildingsMap) {
    const building = buildingsMap[buildingId];
    const buildingDiv = document.createElement("div");
    buildingDiv.className = "building";
    buildingDiv.innerHTML = `<h3>${building.name}</h3>`;

    for (const floor in building.floors) {
      const floorDiv = document.createElement("div");
      floorDiv.className = "floor";
      floorDiv.innerHTML = `<h4>${floor}</h4>`;

      building.floors[floor].forEach((room) => {
        const roomCard = document.createElement("div");
        roomCard.className = "room-card";
        roomCard.innerHTML = `
                        <h5>Room: ${room.room_number}</h5>
                        <p>Seats: ${room.total_seats}</p>
                        <input type="checkbox" class="room-select" value="${room.room_number}" data-seats="${room.total_seats}"/>
                    `;

        // Attach event listener to each room checkbox
        roomCard
          .querySelector(".room-select")
          .addEventListener("change", function (event) {
            const roomSeats = parseInt(
              event.target.getAttribute("data-seats")
            );

            if (event.target.checked) {
              totalAllocatedSeats += roomSeats; // Add seats when selected
            } else {
              totalAllocatedSeats -= roomSeats; // Subtract seats when deselected
            }

            updateAllocatedseat(totalSeats, totalAllocatedSeats); // Update seat statistics
            calculateStudentStatistics();
          });

        floorDiv.appendChild(roomCard);
      });

      buildingDiv.appendChild(floorDiv);
    }

    roomContainer.appendChild(buildingDiv);
  }

  // Initial call to update seat statistics with total seats
  updateAllocatedseat(totalSeats, totalAllocatedSeats);
}

// Fetch room data when the page loads
document.addEventListener("DOMContentLoaded", fetchRoomData);






async function updateSeatStatistics() {
  try {
    // Fetch seat data from the backend
    const response = await fetch("/get_total_seats");
    const data = await response.json();

    // Extract total seats, allocated seats, and available seats from the data
    const totalSeats = data.total_seats;

    // Update the statistics in the HTML
    document.getElementById("totalSeats").textContent = totalSeats;
  } catch (error) {
    console.error("Error fetching seat statistics:", error);
  }
}

// Replace the existing updateAllocatedseat function
function updateAllocatedseat(totalSeats, allocatedSeats) {
  const availableSeats = totalSeats - allocatedSeats;

  // Helper function to update value with animation
  const updateWithAnimation = (elementId, newValue) => {
    const element = document.getElementById(elementId);
    const oldValue = element.textContent;
    element.textContent = newValue;
    
    if (oldValue !== newValue.toString()) {
      element.classList.remove('changed');
      void element.offsetWidth; // Trigger reflow
      element.classList.add('changed');
    }
  };

  // Update values with animation
  updateWithAnimation("totalSeats", totalSeats);
  updateWithAnimation("allocatedSeats", allocatedSeats);
  updateWithAnimation("availableSeats", availableSeats);

  // Update statistics container style based on seat allocation
  const statisticsContainer = document.querySelector('.statistics');
  if (allocatedSeats < parseInt(document.getElementById("totalStudents").textContent || "0")) {
    statisticsContainer.classList.add('insufficient-seats');
  } else {
    statisticsContainer.classList.remove('insufficient-seats');
  }
}

// Call the function to update seat statistics when the page loads
document.addEventListener("DOMContentLoaded", updateSeatStatistics);

// Update Student detail
document
  .getElementById("allocatedSeatsTable")
  .addEventListener("click", function (event) {
    const target = event.target;

    // Ensure the clicked element is a checkbox in a table row
    if (target.tagName === "INPUT" && target.type === "checkbox") {
      // Fetch and sum total students for all selected rows
      calculateStudentStatistics();
    }
  });

// Replace the existing calculateStudentStatistics function
async function calculateStudentStatistics() {
  let totalStudentsSum = 0;
  let allocatedStudentsSum = 0;

  // Get the current allocated seats value from the span
  const allocatedSeats =
    parseInt(document.getElementById("allocatedSeats").textContent) || 0;

  const tableRows = document.querySelectorAll(
    "#allocatedSeatsTable tbody tr"
  );
  const selectedRows = Array.from(tableRows).filter((row) => {
    const checkbox = row.querySelector("input[type='checkbox']");
    return checkbox && checkbox.checked;
  });

  for (const row of selectedRows) {
    const branch = row.cells[1].textContent;
    const date = row.cells[2].textContent;
    const time = row.cells[3].textContent;

    if (branch && date && time) {
      try {
        // Fetch the total students for the branch, date, and time
        const response = await fetch(
          `/get_total_students/${branch}/${date}/${time}`
        );
        const data = await response.json();

        totalStudentsSum += data.total_students;
      } catch (error) {
        console.error("Error fetching total students:", error);
      }
    }
  }

  // Allocated Students Logic
  if (allocatedSeats <= totalStudentsSum) {
    allocatedStudentsSum = allocatedSeats;
  } else {
    allocatedStudentsSum = totalStudentsSum;
  }

  // Remaining Students Calculation
  const remainingStudents = Math.max(
    totalStudentsSum - allocatedStudentsSum,
    0
  );

  // Update with animation
  const updateWithAnimation = (elementId, newValue) => {
    const element = document.getElementById(elementId);
    const oldValue = element.textContent;
    element.textContent = newValue;
    
    if (oldValue !== newValue.toString()) {
      element.classList.remove('changed');
      void element.offsetWidth;
      element.classList.add('changed');
    }
  };

  updateWithAnimation("totalStudents", totalStudentsSum);
  updateWithAnimation("allocatedStudents", allocatedStudentsSum);
  updateWithAnimation("remainingStudents", remainingStudents);

  // Update statistics container style based on seat allocation
  const statisticsContainer = document.querySelector('.statistics');
  const mainVisual = document.querySelector('.main-visual');
  const roomCards = document.querySelectorAll('.room-card');

  if (allocatedSeats < totalStudentsSum) {
    statisticsContainer.classList.add('insufficient-seats');
    mainVisual.style.backgroundColor = '#ffebee';
    roomCards.forEach(card => {
      card.classList.add('insufficient-seats');
    });
  } else {
    statisticsContainer.classList.remove('insufficient-seats');
    mainVisual.style.backgroundColor = '';
    roomCards.forEach(card => {
      card.classList.remove('insufficient-seats');
    });
  }
}



// Add these at the end of the file
document.addEventListener('DOMContentLoaded', function() {
  const statistics = document.querySelector('.statistics');
  const mainContainer = document.querySelector('.maincontainer');
  
  // Set initial position relative to nav height if exists
  const nav = document.querySelector('nav');
  if (nav) {
    statistics.style.top = `${nav.offsetHeight + 20}px`;
  }

  // Handle window resize
  window.addEventListener('resize', function() {
    if (nav) {
      statistics.style.top = `${nav.offsetHeight + 20}px`;
    }
  });
});







document.addEventListener('DOMContentLoaded', function() {
  const popup = document.getElementById('statisticsPopup');
  const minimizeBtn = document.getElementById('minimizeStats');
  const closeBtn = document.getElementById('closeStats');
  const showStatsBtn = document.getElementById('showStats');
  const popupHeader = document.querySelector('.popup-header');

  // Initialize popup position
  let popupPosition = {
      x: parseInt(localStorage.getItem('statsPopupX')) || 20,
      y: parseInt(localStorage.getItem('statsPopupY')) || 80
  };

  // Set initial position
  popup.style.transform = `translate3d(${popupPosition.x}px, ${popupPosition.y}px, 0)`;

  // Minimize functionality
  minimizeBtn.addEventListener('click', function() {
      popup.classList.toggle('minimized');
      this.textContent = popup.classList.contains('minimized') ? '□' : '−';
  });

  // Close functionality
  closeBtn.addEventListener('click', function() {
      popup.style.display = 'none';
      showStatsBtn.style.display = 'block';
  });

  // Show button functionality
  showStatsBtn.addEventListener('click', function() {
      popup.style.display = 'block';
      this.style.display = 'none';
      popup.classList.remove('minimized');
      minimizeBtn.textContent = '−';
  });

  // Dragging functionality
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;

  function dragStart(e) {
      if (e.target === popupHeader || e.target.parentElement === popupHeader) {
          initialX = e.clientX - popupPosition.x;
          initialY = e.clientY - popupPosition.y;
          isDragging = true;
      }
  }

  function drag(e) {
      if (isDragging) {
          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
          popupPosition.x = currentX;
          popupPosition.y = currentY;
          popup.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
  }

  function dragEnd() {
      isDragging = false;
      localStorage.setItem('statsPopupX', popupPosition.x);
      localStorage.setItem('statsPopupY', popupPosition.y);
  }

  // Add event listeners for dragging
  popupHeader.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
});

// Update the updateAllocatedseat function
function updateAllocatedseat(totalSeats, allocatedSeats) {
  const availableSeats = totalSeats - allocatedSeats;
  
  // Update statistics values
  document.getElementById("totalSeats").textContent = totalSeats;
  document.getElementById("allocatedSeats").textContent = allocatedSeats;
  document.getElementById("availableSeats").textContent = availableSeats;
  
  // Get current total students
  const totalStudents = parseInt(document.getElementById("totalStudents").textContent || "0");
  
  // Get elements for color changes
  const mainVisual = document.querySelector('.main-visual');
  const roomCards = document.querySelectorAll('.room-card');
  const statisticsPopup = document.getElementById('statisticsPopup');
  
  // Check if allocated seats are less than total students
  if (allocatedSeats < totalStudents) {
      // Apply warning styles
      if (mainVisual) {
          mainVisual.style.backgroundColor = '#ffebee';
      }
      roomCards.forEach(card => {
          card.style.borderColor = '#ff0000';
      });
      // Add class for red statistics numbers
      statisticsPopup.classList.add('insufficient-seats');
  } else {
      // Reset styles
      if (mainVisual) {
          mainVisual.style.backgroundColor = '';
      }
      roomCards.forEach(card => {
          card.style.borderColor = '';
      });
      // Remove class for red statistics numbers
      statisticsPopup.classList.remove('insufficient-seats');
  }

  calculateStudentStatistics();
}

// Update the calculateStudentStatistics function
async function calculateStudentStatistics() {
  let totalStudentsSum = 0;
  let allocatedStudentsSum = 0;

  const allocatedSeats = parseInt(document.getElementById("allocatedSeats").textContent) || 0;
  const tableRows = document.querySelectorAll("#allocatedSeatsTable tbody tr");
  
  const selectedRows = Array.from(tableRows).filter((row) => {
      const checkbox = row.querySelector("input[type='checkbox']");
      return checkbox && checkbox.checked;
  });

  for (const row of selectedRows) {
      const branch = row.cells[1].textContent;
      const date = row.cells[2].textContent;
      const time = row.cells[3].textContent;

      if (branch && date && time) {
          try {
              const response = await fetch(`/get_total_students/${branch}/${date}/${time}`);
              const data = await response.json();
              totalStudentsSum += data.total_students;
          } catch (error) {
              console.error("Error fetching total students:", error);
          }
      }
  }

  // Calculate allocated and remaining students
  allocatedStudentsSum = Math.min(allocatedSeats, totalStudentsSum);
  const remainingStudents = Math.max(totalStudentsSum - allocatedSeats, 0);

  // Update the statistics display
  document.getElementById("totalStudents").textContent = totalStudentsSum;
  document.getElementById("allocatedStudents").textContent = allocatedStudentsSum;
  document.getElementById("remainingStudents").textContent = remainingStudents;

  // Update warning styles
  const mainVisual = document.querySelector('.main-visual');
  const roomCards = document.querySelectorAll('.room-card');
  const statisticsPopup = document.getElementById('statisticsPopup');

  if (allocatedSeats < totalStudentsSum) {
      // Apply all warning styles
      if (mainVisual) {
          mainVisual.style.backgroundColor = '#ffebee';
      }
      roomCards.forEach(card => {
          card.style.borderColor = '#ff0000';
      });
      statisticsPopup.classList.add('insufficient-seats');
  } else {
      // Reset all styles
      if (mainVisual) {
          mainVisual.style.backgroundColor = '';
      }
      roomCards.forEach(card => {
          card.style.borderColor = '';
      });
      statisticsPopup.classList.remove('insufficient-seats');
  }
}

// Add these styles to your existing room-card styles in seat.html