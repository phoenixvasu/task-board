# 🎯 Task Board - Real-time Collaborative Project Management

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

A modern, real-time collaborative task board application built with React, Node.js, and Socket.IO. Features drag-and-drop task management, role-based permissions, and live collaboration across multiple users with a beautiful, responsive interface.

## ✨ Key Features

### 🚀 Core Functionality

- **Real-time Collaboration**: Live updates across multiple users with Socket.IO
- **Drag & Drop Interface**: Intuitive task management with smooth animations
- **Role-based Permissions**: Owner, Editor, and Viewer roles with granular permissions
- **Board Sharing**: Add team members with different permission levels
- **Task Management**: Create, edit, organize, and track tasks with priorities and due dates

### 🔐 Security & Authentication

- **JWT Authentication**: Secure token-based authentication with expiration
- **Password Hashing**: Bcrypt password encryption with salt rounds
- **Role-based Access Control**: Permission-based feature access
- **CORS Protection**: Cross-origin request protection with configurable origins

### 🎨 User Experience

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes with persistent preferences
- **Real-time Notifications**: Toast notifications for user actions
- **Search & Filtering**: Advanced task filtering and search capabilities
- **Smooth Animations**: Framer Motion powered transitions and interactions

### 🔧 Technical Excellence

- **TypeScript**: Full type safety across frontend and backend
- **Modern Stack**: Built with latest React 18, Node.js, and MongoDB
- **Performance Optimized**: Vite for fast development and optimized builds
- **Health Monitoring**: Built-in health checks and comprehensive error handling

## 🛠️ Tech Stack

### Frontend

| Technology           | Purpose                 | Version |
| -------------------- | ----------------------- | ------- |
| **React 18**         | UI Framework            | Latest  |
| **TypeScript**       | Type Safety             | 5.x     |
| **Vite**             | Build Tool & Dev Server | 5.x     |
| **Tailwind CSS**     | Utility-first Styling   | 3.x     |
| **Zustand**          | State Management        | 4.x     |
| **Socket.IO Client** | Real-time Communication | 4.x     |
| **React Router**     | Client-side Routing     | 6.x     |
| **React Hot Toast**  | User Notifications      | 2.x     |
| **Framer Motion**    | Animations              | 10.x    |
| **Lucide React**     | Icon Library            | Latest  |

### Backend

| Technology     | Purpose              | Version |
| -------------- | -------------------- | ------- |
| **Node.js**    | Runtime Environment  | 18+     |
| **Express**    | Web Framework        | 4.x     |
| **TypeScript** | Type Safety          | 5.x     |
| **Socket.IO**  | Real-time Features   | 4.x     |
| **MongoDB**    | Database             | 6.x     |
| **Mongoose**   | ODM                  | 8.x     |
| **JWT**        | Authentication       | 9.x     |
| **bcryptjs**   | Password Hashing     | 2.x     |
| **CORS**       | Cross-origin Support | 2.x     |

## 📁 Project Structure

```
task-board/
├── 📁 src/                          # Frontend source code
│   ├── 📁 components/               # React components
│   │   ├── 📁 board/               # Board-related components
│   │   │   └── BoardColumns.tsx    # Board columns container
│   │   ├── 📁 column/              # Column components
│   │   │   └── Column.tsx          # Individual column component
│   │   ├── 📁 task/                # Task components
│   │   │   └── TaskCard.tsx        # Task card component
│   │   ├── 📁 layout/              # Layout components
│   │   │   └── Header.tsx          # Application header
│   │   └── 📁 ui/                  # Reusable UI components
│   │       ├── Avatar.tsx          # User avatar component
│   │       ├── Button.tsx          # Button component
│   │       ├── Dropdown.tsx        # Dropdown component
│   │       ├── Modal.tsx           # Modal component
│   │       └── Tag.tsx             # Tag component
│   ├── 📁 pages/                   # Page components
│   │   ├── BoardList.tsx           # Board listing page
│   │   ├── BoardDetail.tsx         # Board detail page
│   │   └── Login.tsx               # Login page
│   ├── 📁 store/                   # State management
│   │   ├── useAuthStore.ts         # Authentication state
│   │   └── useBoardStore.ts        # Board state
│   ├── 📁 api/                     # API utilities
│   │   └── index.ts                # API client
│   ├── 📁 types/                   # TypeScript types
│   │   └── index.ts                # Type definitions
│   └── 📁 utils/                   # Utility functions
│       └── index.ts                # Utility functions
├── 📁 backend/                     # Backend source code
│   ├── 📁 routes/                  # API routes
│   │   ├── auth.ts                 # Authentication routes
│   │   ├── board.ts                # Board routes
│   │   ├── user.ts                 # User routes
│   │   └── sharing.ts              # Sharing routes
│   ├── 📁 models/                  # Database models
│   │   ├── Board.ts                # Board model
│   │   └── User.ts                 # User model
│   ├── 📁 services/                # Business logic
│   │   └── sharingService.ts       # Sharing service
│   ├── 📁 middleware/              # Express middleware
│   │   └── auth.ts                 # Authentication middleware
│   ├── index.ts                    # Main server file
│   ├── package.json                # Backend dependencies
│   ├── tsconfig.json               # TypeScript config
│   └── .env                        # Backend environment variables
├── 📁 public/                      # Static assets
├── index.html                      # HTML template
├── package.json                    # Frontend dependencies
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS config
├── tsconfig.json                   # TypeScript config
├── .env                            # Frontend environment variables
├── vercel.json                     # Vercel deployment config
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local or cloud instance) - [MongoDB Atlas](https://www.mongodb.com/atlas) recommended
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd task-board
   ```

2. **Install dependencies**:

   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Set up environment variables**:

   **Backend** (create `backend/.env`):

   ```bash
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskboard
   JWT_SECRET=your-super-secret-jwt-key-here
   CORS_ORIGIN=http://localhost:3000
   NODE_ENV=development
   ```

   **Frontend** (create `.env` in root):

   ```bash
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the development servers**:

   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev

   # Terminal 2: Start frontend
   npm run dev
   ```

5. **Access the application**:
   - 🌐 Frontend: http://localhost:3000
   - 🔌 Backend API: http://localhost:5000
   - 💚 Health Check: http://localhost:5000/api/health

## 📖 User Guide

### 🔐 Authentication

#### Registration

1. Navigate to the signup page
2. Enter your email, username, and password
3. Verify your account and login

#### Login

1. Use your credentials to login
2. Access your dashboard with all your boards
3. JWT tokens are automatically managed

### 📋 Board Management

#### Creating Boards

1. Click "Create Board" button
2. Enter board name and description
3. Start organizing tasks immediately

#### Adding Columns

1. Use the "Add Column" button
2. Create workflow columns (e.g., To Do, In Progress, Done)
3. Reorder columns by dragging

#### Creating Tasks

1. Click "Add Task" in any column
2. Fill in task details:
   - **Title**: Task name
   - **Description**: Detailed description
   - **Priority**: Low, Medium, High
   - **Due Date**: Set deadlines
   - **Assignee**: Assign to team members

### 👥 Collaboration & Permissions

#### Sharing Boards

1. Click the "Share" button on any board
2. Add team members by email
3. Set appropriate roles:

| Role       | Permissions                                       |
| ---------- | ------------------------------------------------- |
| **Owner**  | Full control, can manage members and delete board |
| **Editor** | Can edit tasks, columns, and board settings       |
| **Viewer** | Read-only access to view tasks and board          |

#### Real-time Features

- ✅ Changes appear instantly for all users
- 👥 See who's currently viewing the board
- 📡 Monitor connection status
- 🔔 Real-time notifications for all actions

### 🎯 Task Management

#### Drag & Drop

- 🖱️ Move tasks between columns
- 📝 Reorder tasks within columns
- ⚡ Real-time synchronization across all users

#### Task Details

- ✏️ Click on tasks to edit
- 🏷️ Set priorities and due dates
- 👤 Assign to team members
- 📄 Add descriptions and notes

#### Search & Filter

- 🔍 Use the search bar to find tasks
- 🎛️ Filter by priority, assignee, or due date
- 📊 Sort tasks by various criteria

## 🔌 API Reference

### Authentication Endpoints

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| `POST` | `/api/auth/register` | User registration   |
| `POST` | `/api/auth/login`    | User login          |
| `GET`  | `/api/auth/profile`  | Get user profile    |
| `PUT`  | `/api/auth/profile`  | Update user profile |

### Board Endpoints

| Method   | Endpoint          | Description       |
| -------- | ----------------- | ----------------- |
| `GET`    | `/api/boards`     | Get user's boards |
| `POST`   | `/api/boards`     | Create new board  |
| `GET`    | `/api/boards/:id` | Get board details |
| `PUT`    | `/api/boards/:id` | Update board      |
| `DELETE` | `/api/boards/:id` | Delete board      |

### Task Endpoints

| Method   | Endpoint                                  | Description               |
| -------- | ----------------------------------------- | ------------------------- |
| `POST`   | `/api/boards/:boardId/tasks`              | Create task               |
| `PUT`    | `/api/boards/:boardId/tasks/:taskId`      | Update task               |
| `DELETE` | `/api/boards/:boardId/tasks/:taskId`      | Delete task               |
| `POST`   | `/api/boards/:boardId/tasks/:taskId/move` | Move task between columns |

### Column Endpoints

| Method   | Endpoint                                               | Description             |
| -------- | ------------------------------------------------------ | ----------------------- |
| `POST`   | `/api/boards/:boardId/columns`                         | Create column           |
| `PUT`    | `/api/boards/:boardId/columns/:columnId`               | Update column           |
| `DELETE` | `/api/boards/:boardId/columns/:columnId`               | Delete column           |
| `POST`   | `/api/boards/:boardId/columns/:columnId/tasks/reorder` | Reorder tasks in column |

### Sharing Endpoints

| Method   | Endpoint                                            | Description        |
| -------- | --------------------------------------------------- | ------------------ |
| `GET`    | `/api/sharing/boards/:boardId/members`              | Get board members  |
| `POST`   | `/api/sharing/boards/:boardId/members`              | Add member         |
| `DELETE` | `/api/sharing/boards/:boardId/members/:userId`      | Remove member      |
| `PUT`    | `/api/sharing/boards/:boardId/members/:userId/role` | Update member role |

### Health Check

| Method | Endpoint      | Description          |
| ------ | ------------- | -------------------- |
| `GET`  | `/api/health` | Server health status |

## 🗄️ Database Schema

### User Model

```typescript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (hashed, required),
  avatar: String (optional),
  createdAt: String,
  updatedAt: String
}
```

### Board Model

```typescript
{
  _id: ObjectId,
  id: String (unique),
  name: String (required),
  description: String (optional),
  createdBy: ObjectId (ref: User),
  isPublic: Boolean (default: false),
  columns: [{
    id: String,
    name: String,
    taskIds: [String],
    createdAt: String,
    updatedAt: String
  }],
  tasks: Map<String, {
    id: String,
    title: String,
    description: String,
    createdBy: ObjectId,
    assignedTo: ObjectId (optional),
    priority: "low" | "medium" | "high",
    dueDate: String,
    createdAt: String,
    updatedAt: String
  }>,
  members: [{
    userId: ObjectId (ref: User),
    role: "owner" | "editor" | "viewer",
    invitedBy: ObjectId (ref: User),
    invitedAt: String,
    joinedAt: String (optional),
    permissions: {
      canView: Boolean,
      canEdit: Boolean,
      canDelete: Boolean,
      canInvite: Boolean,
      canManageMembers: Boolean
    }
  }],
  settings: {
    allowGuestAccess: Boolean,
    requireApproval: Boolean,
    defaultRole: "editor" | "viewer"
  },
  createdAt: String,
  updatedAt: String
}
```

## 🔄 Real-time Collaboration

### Socket.IO Events

#### Client to Server Events

| Event            | Description               | Payload                                                                                       |
| ---------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `join-board`     | Join a board room         | `{ boardId: string, userId: string }`                                                         |
| `leave-board`    | Leave a board room        | `{ boardId: string, userId: string }`                                                         |
| `task-added`     | Create a new task         | `{ boardId: string, task: Task }`                                                             |
| `task-updated`   | Update an existing task   | `{ boardId: string, taskId: string, updates: Partial<Task> }`                                 |
| `task-deleted`   | Delete a task             | `{ boardId: string, taskId: string }`                                                         |
| `task-moved`     | Move task between columns | `{ boardId: string, taskId: string, fromColumn: string, toColumn: string, position: number }` |
| `column-added`   | Create a new column       | `{ boardId: string, column: Column }`                                                         |
| `column-updated` | Update column details     | `{ boardId: string, columnId: string, updates: Partial<Column> }`                             |
| `column-deleted` | Delete a column           | `{ boardId: string, columnId: string }`                                                       |
| `user-editing`   | User is editing a task    | `{ boardId: string, taskId: string, userId: string }`                                         |
| `activity`       | User activity heartbeat   | `{ boardId: string, userId: string }`                                                         |

#### Server to Client Events

| Event            | Description               | Payload                                                                      |
| ---------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `user-joined`    | New user joined the board | `{ userId: string, user: User }`                                             |
| `user-left`      | User left the board       | `{ userId: string }`                                                         |
| `active-users`   | List of active users      | `{ users: User[] }`                                                          |
| `task-created`   | New task created          | `{ task: Task }`                                                             |
| `task-updated`   | Task updated              | `{ taskId: string, updates: Partial<Task> }`                                 |
| `task-deleted`   | Task deleted              | `{ taskId: string }`                                                         |
| `task-moved`     | Task moved                | `{ taskId: string, fromColumn: string, toColumn: string, position: number }` |
| `column-created` | New column created        | `{ column: Column }`                                                         |
| `column-updated` | Column updated            | `{ columnId: string, updates: Partial<Column> }`                             |
| `column-deleted` | Column deleted            | `{ columnId: string }`                                                       |
| `board-updated`  | Board details updated     | `{ boardId: string, updates: Partial<Board> }`                               |
| `board-deleted`  | Board deleted             | `{ boardId: string }`                                                        |

## 🔒 Security Features

### Authentication & Authorization

- **JWT Authentication**: Secure token-based authentication with expiration
- **Password Hashing**: Bcrypt password encryption with salt rounds
- **Role-based Access Control**: Permission-based feature access
- **Session Management**: Secure session handling and token refresh

### Data Protection

- **CORS Protection**: Cross-origin request protection with configurable origins
- **Input Validation**: Server-side data validation and sanitization
- **MongoDB Injection Protection**: Mongoose query sanitization
- **XSS Protection**: Input sanitization and output encoding

### Environment Security

- **Environment Variable Security**: Sensitive data stored in environment variables
- **Error Handling**: Comprehensive error handling without exposing sensitive information
- **Request Rate Limiting**: Protection against brute force attacks

## 🚀 Deployment Guide

### Backend Deployment (Render)

1. **Create a Render account** and connect your GitHub repository

2. **Create a new Web Service**:

   - **Name**: `taskboard-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

3. **Configure environment variables** in Render dashboard:

   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskboard
   JWT_SECRET=your-super-secret-jwt-key-here
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   NODE_ENV=production
   ```

4. **Deploy** and note the backend URL (e.g., `https://taskboard-backend.onrender.com`)

### Frontend Deployment (Vercel)

1. **Create a Vercel account** and import your GitHub repository

2. **Configure environment variables** in Vercel dashboard:

   ```bash
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

3. **Deploy** and get your frontend URL (e.g., `https://taskboard-frontend.vercel.app`)

4. **Update CORS** in your backend environment variables with your Vercel frontend URL

### Environment Variables

#### Backend (.env)

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskboard

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration (comma-separated for multiple origins)
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

#### Frontend (.env)

```bash
# API Configuration
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### Deployment Troubleshooting

#### Common Issues:

| Issue                     | Solution                                                     |
| ------------------------- | ------------------------------------------------------------ |
| **CORS Errors**           | Ensure `CORS_ORIGIN` is set correctly in backend             |
| **Build Failures**        | Check Node.js version compatibility (v18+)                   |
| **Database Connection**   | Verify MongoDB URI and network access                        |
| **Environment Variables** | Ensure all required variables are set in deployment platform |
| **Port Issues**           | Render automatically sets PORT, don't override               |

## 💻 Development

### Available Scripts

#### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

#### Backend

```bash
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript
npm start            # Start production server
npm run lint         # Run ESLint
```

### Code Style Guidelines

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (recommended)
- **Conventional Commits**: Git commit message format

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature-name`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'feat: add new feature'`
5. **Push to the branch**: `git push origin feature-name`
6. **Create a Pull Request**

## 🧪 Testing

### Manual Testing Checklist

#### Authentication

- [ ] User registration
- [ ] User login/logout
- [ ] Password validation
- [ ] JWT token management

#### Board Management

- [ ] Create new boards
- [ ] Edit board details
- [ ] Delete boards
- [ ] Board sharing

#### Task Management

- [ ] Create tasks
- [ ] Edit task details
- [ ] Delete tasks
- [ ] Move tasks between columns
- [ ] Task filtering and search

#### Real-time Features

- [ ] Live updates across users
- [ ] User presence indicators
- [ ] Real-time notifications
- [ ] Connection status

#### Permissions

- [ ] Role-based access control
- [ ] Permission validation
- [ ] Member management

### Performance Testing

- [ ] Load testing with multiple users
- [ ] Database query optimization
- [ ] Real-time connection stability
- [ ] Memory usage monitoring

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature-name`
3. **Make your changes** and test thoroughly
4. **Follow the code style** guidelines
5. **Commit your changes**: `git commit -m 'feat: add new feature'`
6. **Push to the branch**: `git push origin feature-name`
7. **Create a Pull Request** with detailed description

### Code Style Guidelines

- Use TypeScript for all new code
- Follow ESLint rules
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

For support and questions:

- **Create an issue** in the repository
- **Check the documentation** for common solutions
- **Review the testing guide** for troubleshooting
- **Check deployment logs** for deployment issues

### Common Support Topics

| Issue                     | Solution                                        |
| ------------------------- | ----------------------------------------------- |
| **Authentication Issues** | Check JWT_SECRET and token expiration           |
| **Real-time Issues**      | Verify Socket.IO connection and CORS settings   |
| **Permission Issues**     | Check user roles and board access               |
| **Deployment Issues**     | Verify environment variables and build commands |
| **Database Issues**       | Check MongoDB connection and network access     |

### Performance Optimization

- **Database Indexing**: Ensure proper indexes on frequently queried fields
- **Caching**: Implement Redis for session storage (optional)
- **CDN**: Use CDN for static assets
- **Compression**: Enable gzip compression
- **Monitoring**: Implement application monitoring

---

<div align="center">

**Built with ❤️ using React, Node.js, and Socket.IO**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/task-board?style=social)](https://github.com/yourusername/task-board)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/task-board?style=social)](https://github.com/yourusername/task-board)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/task-board)](https://github.com/yourusername/task-board/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/task-board)](https://github.com/yourusername/task-board/pulls)

</div>
