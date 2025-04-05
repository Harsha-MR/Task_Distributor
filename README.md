# MERN Stack Task Manager Application

A comprehensive task management system built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

- Admin user authentication with JWT
- Agent management (CRUD operations)
- CSV file upload and task distribution
- Real-time task progress tracking
- Dark/Light theme support
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

## Usage

1. **Login**
   - Use the admin credentials to log in
   - The system uses JWT for authentication

2. **Agent Management**
   - Add, edit, or delete agents
   - View agent details and assigned tasks

3. **Task Distribution**
   - Upload CSV files containing task lists
   - Tasks are automatically distributed among agents
   - Monitor task completion progress

4. **Dashboard**
   - View overall statistics
   - Monitor agent performance
   - Track task completion rates

## File Structure

```
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
└── README.md
```

## API Endpoints

### Authentication
- POST /api/auth/login - User login

### Agents
- GET /api/agents - Get all agents
- POST /api/agents - Create new agent
- PUT /api/agents/:id - Update agent
- DELETE /api/agents/:id - Delete agent

### Tasks
- POST /api/tasks/upload - Upload and distribute tasks
- GET /api/tasks - Get all tasks
- GET /api/tasks/:agentId - Get tasks for specific agent

### Statistics
- GET /api/stats - Get system statistics

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 