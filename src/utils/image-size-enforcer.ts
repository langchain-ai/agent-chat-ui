/**
 * Image Size Enforcer - JavaScript-based image size control
 * This provides a fallback for any images that bypass CSS rules
 */

export function enforceImageSizes() {
  // Function to resize an image element
  const resizeImage = (img: HTMLImageElement) => {
    const maxHeight = window.innerWidth <= 480 ? 160 : window.innerWidth <= 768 ? 224 : 288;
    
    // Apply styles directly to the element
    img.style.setProperty('max-width', '100%', 'important');
    img.style.setProperty('width', 'auto', 'important');
    img.style.setProperty('height', 'auto', 'important');
    img.style.setProperty('max-height', `${maxHeight}px`, 'important');
    img.style.setProperty('object-fit', 'contain', 'important');
    img.style.setProperty('border-radius', '8px', 'important');
    img.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.1)', 'important');
    img.style.setProperty('display', 'block', 'important');
    img.style.setProperty('margin', '1rem auto', 'important');
  };

  // Process all existing images
  const processExistingImages = () => {
    const images = document.querySelectorAll('img');
    images.forEach(resizeImage);
  };

  // Set up mutation observer to catch dynamically added images
  const setupMutationObserver = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if the added node is an image
            if (element.tagName === 'IMG') {
              resizeImage(element as HTMLImageElement);
            }
            
            // Check for images within the added node
            const images = element.querySelectorAll('img');
            images.forEach(resizeImage);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return observer;
  };

  // Set up resize listener for responsive behavior
  const setupResizeListener = () => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        processExistingImages();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  };

  // Initialize everything
  const init = () => {
    // Process images immediately
    processExistingImages();
    
    // Set up observers
    const observer = setupMutationObserver();
    const cleanupResize = setupResizeListener();
    
    // Return cleanup function
    return () => {
      observer.disconnect();
      cleanupResize();
    };
  };

  return init();
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceImageSizes);
  } else {
    enforceImageSizes();
  }
}
