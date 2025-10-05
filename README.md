# AI Color Detector

An intelligent web application that uses your device's camera and the Google Gemini API to detect and announce the color of objects in real-time.

This project is built with React and Tailwind CSS, running in a modern, build-less environment using ES modules and import maps.

## Features

- **Real-Time Color Detection:** Identifies the dominant color of objects using the camera stream.
- **AI-Powered:** Leverages the powerful `gemini-2.5-flash` model for fast and accurate image analysis.
- **Text-to-Speech:** Announces the detected color using a reliable, high-quality AI voice for an accessible experience.
- **Interactive Camera Controls:**
  - Turn the camera on and off.
  - Switch between front-facing and back-facing cameras.
- **User-Friendly Interface:** A clean, modern, and responsive UI with clear status indicators and controls.
- **Zero Build Setup:** Runs directly in the browser without requiring a package manager (like npm) or a build step.

## How It Works

1.  The user turns on the camera.
2.  The application captures a frame from the video stream every few seconds.
3.  The captured frame is converted to a base64 string.
4.  This image data is sent to the Google Gemini API with a specialized prompt asking it to identify the main color.
5.  The AI returns a single word describing the color (e.g., "Red").
6.  The application displays the color name on the screen and uses a Text-to-Speech service to announce it out loud.

## Deployment

This application is designed to be hosted on any static web hosting service, such as GitHub Pages, Vercel, or Netlify.

### Handling the API Key

The application code in `services/geminiService.ts` references `process.env.API_KEY` to get the required Google Gemini API key. In a browser environment, `process.env` is not available by default.

**⚠️ Important:** Never commit your API key directly into your Git repository.

For a production deployment, you should use a build tool like [Vite](https://vitejs.dev/) or [Create React App](https://create-react-app.dev/) to manage your environment variables securely.

**Example with Vite:**

1.  Set up a simple Vite project and move the existing source files into it.
2.  Create a file named `.env.local` in your project's root directory.
3.  Add your API key to this file:
    ```
    VITE_API_KEY=your_gemini_api_key_here
    ```
4.  Update the code in `services/geminiService.ts` to use Vite's syntax for environment variables:
    ```typescript
    // Before
    // const API_KEY = process.env.API_KEY;

    // After
    const API_KEY = import.meta.env.VITE_API_KEY;
    ```
5.  When you run `npm run build`, Vite will replace `import.meta.env.VITE_API_KEY` with your actual key in the final, built files. The `.env.local` file should be listed in your `.gitignore` to keep your key safe.

By following this process, you can safely deploy the application to any hosting service without exposing your secret API key.
