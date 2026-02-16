# Calendar App: Agenda Inteligente

A smart calendar application built with React and Redux Toolkit, designed for efficient event management, user authentication, and group coordination.

## Overview

This project is a sophisticated frontend calendar application (`calendar-app`) developed using React and Redux Toolkit. It aims to provide a robust platform for users to manage their personal events, authenticate securely, and visualize events from other users. The application integrates with a separate backend API (built with Node.js, Express, and MongoDB) to handle data persistence and user authentication.

## Tech Stack

The following technologies and tools are used in this project:

| Technology          | Category            | Notes                                                                                               |
| :------------------ | :------------------ | :-------------------------------------------------------------------------------------------------- |
| JavaScript          | Language            | Primary language for frontend development.                                                          |
| React               | Frontend Framework  | For building dynamic and interactive user interfaces.                                               |
| Redux Toolkit       | State Management    | Efficient global state management.                                                                  |
| Axios               | HTTP Client         | For making API requests to the backend.                                                             |
| Firebase            | Backend Service     | Likely used for authentication, real-time database, or other backend functionalities.               |
| React Big Calendar  | UI Component        | Provides a flexible and feature-rich calendar view.                                                 |
| React Datepicker    | UI Component        | For intuitive date selection in forms.                                                              |
| Sweetalert2         | UI Component        | For customizable and responsive alert messages.                                                     |
| Jest                | Testing Framework   | For unit and integration testing of JavaScript code.                                                |
| Babel               | Transpiler          | Compiles modern JavaScript code for broader browser compatibility.                                  |
| CSS                 | Styling             | For styling the application's user interface.                                                       |
| HTML                | Markup Language     | For structuring the web content.                                                                    |
| Python              | Language (Detected) | Detected as part of the repository, but not a primary dependency in this frontend `package.json`.   |
| Java                | Language (Detected) | Detected as part of the repository, but not a primary dependency in this frontend `package.json`.   |

## Features

*   **User Authentication:** Secure user registration and login to access personalized calendar functionalities.
*   **Detailed Calendar Views:** Offers multiple views including Agenda, Daily, Weekly, and Monthly to visualize events.
*   **Event Management:** Users can add, edit, and remove their own events, including specific dates, times, and descriptions.
*   **Cross-User Event Visibility:** Allows users to view events created by other individuals, facilitating group coordination and planning.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: A JavaScript runtime environment. (Version implied by `package.json` dependencies).
*   **npm** (Node Package Manager) or **Yarn/pnpm**: For managing project dependencies.
*   **Backend API**: This frontend application requires a compatible backend API to function correctly. A Node.js, Express, and MongoDB backend is mentioned as a companion. Ensure it is running and accessible.

## Installation

Follow these steps to set up and run the project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Milpagit/Agenda-Inteligente.git
    ```
2.  **Navigate into the project directory:**
    ```bash
    cd Agenda-Inteligente
    ```
3.  **Rename the environment file:**
    Rename `.env.template` to `.env`.
    ```bash
    mv .env.template .env
    ```
4.  **Configure environment variables:**
    Open the newly created `.env` file and replace the placeholder value for `REACT_APP_API_URL` with the URL of your running backend API.
    ```
    REACT_APP_API_URL="http://localhost:4000/api"
    ```
5.  **Install dependencies:**
    ```bash
    npm install
    ```

## Usage

To start the development server and run the application:

```bash
npm start
```

This command will launch the application in development mode. Open [http://localhost:3000](http://localhost:3000) (or the port indicated in your console) to view it in your browser. Ensure your backend API is running and accessible at the `REACT_APP_API_URL` specified in your `.env` file for full functionality.

## Scripts

The project includes several npm scripts for common development tasks:

*   `npm start`: Starts the development server.
*   `npm build`: Builds the application for production to the `build` folder.
*   `npm test`: Runs tests using Jest in watch mode.
*   `npm eject`: Removes the single build dependency from your project. Use with caution.

## Folder Structure

The project generally follows a standard Create React App structure:

```
Agenda-Inteligente/
├── public/
├── src/
│   ├── assets/
│   │   └── readme/
│   ├── ... (other source files)
├── .env.template
├── package.json
├── ... (other configuration files)
```

## Contributing

Contributions are welcome! If you'd like to improve this calendar application, please feel free to:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes.
4.  Commit your changes and push them to your fork.
5.  Submit a pull request.

## License

The license for this project is not explicitly specified in the provided repository data. Please contact the owner for licensing information.
