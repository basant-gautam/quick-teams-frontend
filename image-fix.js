// Function to ensure all images in the dashboard have consistent sizes
document.addEventListener('DOMContentLoaded', function() {
  // Apply the team-member-img class to all avatar images
  document.querySelectorAll('.avatar img').forEach(img => {
    img.classList.add('team-member-img');
  });
  
  // Find any large images (like the ram logo) that don't have the proper classes
  document.querySelectorAll('#teammates img:not(.team-member-img)').forEach(img => {
    // Check if image is larger than our standard size
    if (img.naturalWidth > 150 || img.naturalHeight > 150) {
      img.classList.add('decorative-img');
      
      // Wrap the image in a properly sized container if it's not already
      if (!img.parentNode.classList.contains('avatar')) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('avatar');
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
      }
    }
  });
});
