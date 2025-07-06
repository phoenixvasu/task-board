# Task Board Application

A real-time collaborative task board application built with React, Node.js, and Socket.IO. Features drag-and-drop task management, role-based permissions, and live collaboration across multiple users.

## ✨ Features

- **Real-time Collaboration**: Live updates across multiple users with Socket.IO
- **Task Management**: Create, edit, and organize tasks with drag & drop
- **Role-based Permissions**: Owner, Editor, and Viewer roles with granular permissions
- **User Authentication**: Secure JWT-based login and registration system
- **Board Sharing**: Add members with different permission levels
- **Search & Filtering**: Advanced task filtering and search capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes with persistent preferences
- **Real-time Notifications**: Toast notifications for user actions
- **Health Monitoring**: Built-in health checks and error handling

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **Zustand** for lightweight state management
- **Socket.IO Client** for real-time communication
- **React Router** for client-side routing
- **React Hot Toast** for user notifications
- **Framer Motion** for smooth animations
- **Lucide React** for beautiful icons

### Backend

- **Node.js** with Express framework
- **TypeScript** for type safety and better development experience
- **Socket.IO** for real-time features and WebSocket support
- **MongoDB** with Mongoose ODM
- **JWT** for secure authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests
- **dotenv** for environment variable management

## 📁 Project Structure

```
task-board/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── board/               # Board-related components
│   │   │   └── BoardColumns.tsx # Board columns container
│   │   ├── column/              # Column components
│   │   │   └── Column.tsx       # Individual column component
│   │   ├── task/                # Task components
│   │   │   └── TaskCard.tsx     # Task card component
│   │   ├── layout/              # Layout components
│   │   │   └── Header.tsx       # Application header
│   │   └── ui/                  # Reusable UI components
│   │       ├── Avatar.tsx       # User avatar component
│   │       ├── Button.tsx       # Button component
│   │       ├── Dropdown.tsx     # Dropdown component
│   │       ├── Modal.tsx        # Modal component
│   │       └── Tag.tsx          # Tag component
│   ├── pages/                   # Page components
│   │   ├── BoardList.tsx        # Board listing page
│   │   ├── BoardDetail.tsx      # Board detail page
│   │   └── Login.tsx            # Login page
│   ├── store/                   # State management
│   │   ├── useAuthStore.ts      # Authentication state
│   │   └── useBoardStore.ts     # Board state
│   ├── api/                     # API utilities
│   │   ├── index.ts             # API client
│   │   └── socket.ts            # Socket.IO client
│   ├── types/                   # TypeScript types
│   │   └── index.ts             # Type definitions
│   └── utils/                   # Utility functions
│       └── index.ts             # Utility functions
├── backend/                     # Backend source code
│   ├── routes/                  # API routes
│   │   ├── auth.ts              # Authentication routes
│   │   ├── board.ts             # Board routes
│   │   ├── user.ts              # User routes
│   │   └── sharing.ts           # Sharing routes
│   ├── models/                  # Database models
│   │   ├── Board.ts             # Board model
│   │   └── User.ts              # User model
│   ├── services/                # Business logic
│   │   └── sharingService.ts    # Sharing service
│   ├── middleware/              # Express middleware
│   │   └── auth.ts              # Authentication middleware
│   ├── index.ts                 # Main server file
│   ├── package.json             # Backend dependencies
│   ├── tsconfig.json            # TypeScript config
│   └── .env                     # Backend environment variables
├── public/                      # Static assets
├── index.html                   # HTML template
├── package.json                 # Frontend dependencies
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS config
├── tsconfig.json                # TypeScript config
├── .env                         # Frontend environment variables
├── vercel.json                  # Vercel deployment config
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or cloud instance - MongoDB Atlas recommended)
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
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

## 📖 Usage

### Authentication

1. **Register a new account**:

   - Navigate to the signup page
   - Enter your email, username, and password
   - Verify your account and login

2. **Login**:
   - Use your credentials to login
   - Access your dashboard with all your boards

### Board Management

1. **Create a board**:

   - Click "Create Board" button
   - Enter board name and description
   - Start organizing tasks immediately

2. **Add columns**:

   - Use the "Add Column" button
   - Create workflow columns (e.g., To Do, In Progress, Done)
   - Reorder columns by dragging

3. **Create tasks**:
   - Click "Add Task" in any column
   - Fill in task details (title, description, priority, due date)
   - Assign to team members
   - Set priority levels (Low, Medium, High)

### Collaboration & Permissions

1. **Share boards**:

   - Click the "Share" button on any board
   - Add team members by email
   - Set appropriate roles:
     - **Owner**: Full control, can manage members and delete board
     - **Editor**: Can edit tasks, columns, and board settings
     - **Viewer**: Read-only access to view tasks and board

2. **Real-time updates**:
   - Changes appear instantly for all users
   - See who's currently viewing the board
   - Monitor connection status
   - Real-time notifications for all actions

### Task Management

1. **Drag & Drop**:

   - Move tasks between columns
   - Reorder tasks within columns
   - Real-time synchronization across all users

2. **Task Details**:

   - Click on tasks to edit
   - Set priorities and due dates
   - Assign to team members
   - Add descriptions and notes

3. **Search & Filter**:
   - Use the search bar to find tasks
   - Filter by priority, assignee, or due date
   - Sort tasks by various criteria

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Boards

- `GET /api/boards` - Get user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Tasks

- `POST /api/boards/:boardId/tasks` - Create task
- `PUT /api/boards/:boardId/tasks/:taskId` - Update task
- `DELETE /api/boards/:boardId/tasks/:taskId` - Delete task
- `POST /api/boards/:boardId/tasks/:taskId/move` - Move task between columns

### Columns

- `POST /api/boards/:boardId/columns` - Create column
- `PUT /api/boards/:boardId/columns/:columnId` - Update column
- `DELETE /api/boards/:boardId/columns/:columnId` - Delete column
- `POST /api/boards/:boardId/columns/:columnId/tasks/reorder` - Reorder tasks in column

### Sharing

- `GET /api/sharing/boards/:boardId/members` - Get board members
- `POST /api/sharing/boards/:boardId/members` - Add member
- `DELETE /api/sharing/boards/:boardId/members/:userId` - Remove member
- `PUT /api/sharing/boards/:boardId/members/:userId/role` - Update member role

### Health Check

- `GET /api/health` - Server health status

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

#### Client to Server

- `join-board` - Join a board room
- `leave-board` - Leave a board room
- `task-added` - Create a new task
- `task-updated` - Update an existing task
- `task-deleted` - Delete a task
- `task-moved` - Move task between columns
- `column-added` - Create a new column
- `column-updated` - Update column details
- `column-deleted` - Delete a column
- `user-editing` - User is editing a task
- `activity` - User activity heartbeat

#### Server to Client

- `user-joined` - New user joined the board
- `user-left` - User left the board
- `active-users` - List of active users
- `task-created` - New task created
- `task-updated` - Task updated
- `task-deleted` - Task deleted
- `task-moved` - Task moved
- `column-created` - New column created
- `column-updated` - Column updated
- `column-deleted` - Column deleted
- `board-updated` - Board details updated
- `board-deleted` - Board deleted

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with expiration
- **Password Hashing**: Bcrypt password encryption with salt rounds
- **CORS Protection**: Cross-origin request protection with configurable origins
- **Input Validation**: Server-side data validation and sanitization
- **Role-based Access Control**: Permission-based feature access
- **MongoDB Injection Protection**: Mongoose query sanitization
- **XSS Protection**: Input sanitization and output encoding
- **Environment Variable Security**: Sensitive data stored in environment variables
- **Error Handling**: Comprehensive error handling without exposing sensitive information

## 🚀 Deployment

### Backend Deployment (Render)

1. **Create a Render account** and connect your GitHub repository

2. **Create a new Web Service**:

   - **Name**: `taskboard-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Configure environment variables** in Render dashboard:

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskboard
   JWT_SECRET=your-super-secret-jwt-key-here
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   NODE_ENV=production
   ```

4. **Deploy** and note the backend URL (e.g., `https://taskboard-backend.onrender.com`)

### Frontend Deployment (Vercel)

1. **Create a Vercel account** and import your GitHub repository

2. **Configure environment variables** in Vercel dashboard:

   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

3. **Deploy** and get your frontend URL (e.g., `https://taskboard-frontend.vercel.app`)

4. **Update CORS** in your backend environment variables with your Vercel frontend URL

### Environment Variables

#### Backend (.env)

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskboard

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Server
PORT=5000
NODE_ENV=production

# CORS (comma-separated for multiple origins)
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

#### Frontend (.env)

```bash
# API Configuration
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### Troubleshooting Deployment

#### Common Issues:

1. **CORS Errors**: Ensure `CORS_ORIGIN` is set correctly in backend
2. **Build Failures**: Check Node.js version compatibility (v18+)
3. **Database Connection**: Verify MongoDB URI and network access
4. **Environment Variables**: Ensure all required variables are set in deployment platform
5. **Port Issues**: Render automatically sets PORT, don't override

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

### Code Style

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

See [QUICK_START_TESTING.md](./QUICK_START_TESTING.md) for comprehensive testing guidelines including:

- Manual testing procedures
- Feature testing checklist
- Common issues and solutions
- Performance testing
- Security testing

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

For support and questions:

- **Create an issue** in the repository
- **Check the documentation** for common solutions
- **Review the testing guide** for troubleshooting
- **Check deployment logs** for deployment issues

### Common Support Topics

- **Authentication Issues**: Check JWT_SECRET and token expiration
- **Real-time Issues**: Verify Socket.IO connection and CORS settings
- **Permission Issues**: Check user roles and board access
- **Deployment Issues**: Verify environment variables and build commands

---

**Built with ❤️ using React, Node.js, and Socket.IO**

