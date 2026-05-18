/**
 * THROBBER COMPONENT USAGE GUIDE
 * 
 * The Throbber is a reusable loading spinner component that matches
 * the application's design and theme.
 * 
 * ============================================
 * BASIC USAGE
 * ============================================
 * 
 * import Throbber from './components/Throbber';
 * 
 * // Default small spinner
 * <Throbber />
 * 
 * ============================================
 * PROPS
 * ============================================
 * 
 * size: 'sm' | 'md' | 'lg' (default: 'md')
 *   - sm: 24px spinner (used for inline loading)
 *   - md: 40px spinner (default, used for most cases)
 *   - lg: 56px spinner (used for full screen loading)
 * 
 * text: string (optional)
 *   - Text to display below the spinner
 *   - Example: text="Loading content..."
 * 
 * variant: 'primary' | 'accent' (default: 'primary')
 *   - primary: Dark gray spinner (default, matches app UI)
 *   - accent: Blue library color spinner
 * 
 * fullScreen: boolean (default: false)
 *   - If true: displays centered with backdrop (50% transparent white)
 *   - If false: displays inline
 * 
 * ============================================
 * EXAMPLES
 * ============================================
 * 
 * 1. Small inline spinner
 *    <Throbber size="sm" />
 * 
 * 2. Medium spinner with text
 *    <Throbber size="md" text="Fetching data..." />
 * 
 * 3. Full screen loading overlay
 *    <Throbber fullScreen text="Loading your dashboard..." />
 * 
 * 4. Accent color variant
 *    <Throbber variant="accent" text="Processing..." />
 * 
 * 5. Large full screen spinner
 *    <Throbber size="lg" fullScreen text="Initializing..." variant="accent" />
 * 
 * ============================================
 * USE CASES IN THE APPLICATION
 * ============================================
 * 
 * ✓ Authentication Loading (App.jsx)
 *   <Throbber fullScreen text="Loading…" />
 * 
 * ✓ Data Fetching in Components
 *   {isLoading && <Throbber size="md" text="Loading bookings..." />}
 * 
 * ✓ Form Submission
 *   {isSubmitting && <Throbber size="sm" />}
 * 
 * ✓ Page Transitions
 *   {isNavigating && <Throbber fullScreen />}
 * 
 * ============================================
 * STYLING & THEME
 * ============================================
 * 
 * The spinner uses:
 * - Tailwind CSS for styling
 * - Primary variant: uses library-blue color from theme
 * - Responsive design: scales with different sizes
 * - Backdrop: uses white with blur effect for full screen
 * - Accessibility: includes ARIA labels for screen readers
 * 
 */
