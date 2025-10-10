// Design System Colors
// Update these colors in one place to change them across the entire application

export const colors = {
  // Primary brand color - used for buttons, icons, and accents
  primary: 'rgb(84, 0, 250)',
  
  // Primary bubble color - used for project icons and other circular elements
  primaryBubble: 'rgb(84, 0, 250)',
  
  // Progress bar color - used for circular progress indicators
  progress: 'rgb(84, 0, 250)',
  
  // Background colors
  background: {
    card: 'rgb(18, 18, 18)', // Card and sidebar background
  },
  
  // Text colors
  text: {
    primary: 'rgb(255, 255, 255)', // White text
    secondary: 'rgb(156, 163, 175)', // Gray text
    muted: 'rgb(107, 114, 128)', // Muted text
  },
  
  // Border colors
  border: {
    default: 'rgb(55, 65, 81)', // Default borders
    focus: 'rgb(84, 0, 250)', // Focus borders
  }
} as const

// Helper functions for easy usage
export const getPrimaryColor = () => colors.primary
export const getPrimaryBubbleColor = () => colors.primaryBubble
export const getCardBackground = () => colors.background.card
export const getMainBackground = () => colors.background.main
