const bottomSheet = document.getElementById("wrapper2");
const sheetContent = document.getElementById("right-section"); // Corrected selector
const closeButton = document.getElementById("right-cont-close"); // Close button inside the sheet
let startY = 0;
let translateY = 0;
let isDragging = false;

// Open the bottom sheet
const openBottomSheet = () => {
  bottomSheet.style.transform = "translateY(0)";
  bottomSheet.style.transition = "transform 0.3s ease"; // Smooth transition
  sheetContent.scrollTop = 0; // Reset scroll to top
};

// Close the bottom sheet
const closeBottomSheet = () => {
  bottomSheet.style.transform = `translateY(100%)`;
  bottomSheet.style.transition = "transform 0.3s ease"; // Smooth transition
};

// Open bottom sheet on header click
document.getElementById("header-cell").addEventListener("click", () => {
  openBottomSheet();
});

// Handle close button click
closeButton.addEventListener("click", () => {
  closeBottomSheet();
});

// Handle touchstart event
bottomSheet.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;
  isDragging = true;
  bottomSheet.style.transition = "none"; // Disable transition during dragging
});

// Handle touchmove event
bottomSheet.addEventListener("touchmove", (e) => {
  if (!isDragging) return;

  const currentY = e.touches[0].clientY;
  const diffY = currentY - startY;

  // Handle drag-down gesture
  if (diffY > 0 && sheetContent.scrollTop === 0) {
    // Prevent pull-to-refresh
    if (e.cancelable) e.preventDefault();

    // Dragging down
    translateY = diffY;
    bottomSheet.style.transform = `translateY(${translateY}px)`;
  }
});

// Handle touchend event
bottomSheet.addEventListener("touchend", () => {
  isDragging = false;

  // Close the sheet if dragged down significantly, otherwise reset
  if (translateY > 100) {
    closeBottomSheet();
  } else {
    bottomSheet.style.transform = "translateY(0)";
    bottomSheet.style.transition = "transform 0.3s ease"; // Smooth reset
  }
  translateY = 0;
});

// Allow independent scrolling inside the bottom sheet
sheetContent.addEventListener("touchmove", (e) => {
  // Stop propagation only if content is scrollable
  if (sheetContent.scrollTop > 0) {
    e.stopPropagation(); // Allow scrolling inside content
  } else {
    if (e.cancelable) e.preventDefault(); // Prevent pull-to-refresh
  }
});
