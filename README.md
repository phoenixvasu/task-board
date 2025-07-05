# TaskBoard - Full-Stack Kanban Productivity App

A modern, real-time collaborative Kanban board application built with TypeScript, React, Node.js, Express, MongoDB, and Socket.io. Features comprehensive board sharing, role-based access control, real-time collaboration, and a beautiful responsive UI.

## 🚀 Features

### Core Kanban Functionality

- **Drag & Drop Interface**: Intuitive task management with smooth drag-and-drop using @dnd-kit
- **Board Management**: Create, edit, and delete boards with custom descriptions
- **Column Management**: Add, reorder, and customize columns for workflow stages
- **Task Management**: Create, edit, delete tasks with rich metadata
- **Priority System**: High, medium, low priority levels with visual indicators
- **Due Date Tracking**: Set and track task deadlines with overdue indicators
- **Assignment System**: Assign tasks to team members with user avatars

### Real-Time Collaboration

- **Live Updates**: Real-time synchronization across all connected users
- **User Presence**: See who's currently viewing the board
- **Editing Indicators**: "User is editing..." indicators for tasks
- **Activity Feed**: Toast notifications for all collaborative actions
- **Connection Status**: Real-time connection monitoring
- **Socket.io Integration**: WebSocket-based real-time communication

### Board Sharing & Access Control

- **Role-Based Permissions**: Owner, Admin, Editor, Viewer roles
- **Member Management**: Add, remove, and update member roles
- **Invite Links**: Create secure invite links with role assignment
- **Public/Private Boards**: Control board visibility and access
- **Guest Access**: Optional guest access without accounts
- **JWT Security**: Secure token-based authentication for invites

### User Experience

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Search Functionality**: Global search across boards and tasks
- **Filtering & Sorting**: Filter by priority, assignee, due date
- **Markdown Support**: Rich text descriptions with markdown rendering
- **Toast Notifications**: User-friendly feedback for all actions
- **Smooth Animations**: Framer Motion animations for enhanced UX

### Authentication & Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **Protected Routes**: Route protection with authentication middleware
- **CORS Configuration**: Secure cross-origin resource sharing
- **Input Validation**: Comprehensive server-side validation

## 🏗️ Architecture

### Frontend (React + TypeScript)

```
src/
├── components/          # Reusable UI components
│   ├── ui/            # Base UI components (Button, Modal, etc.)
│   ├── board/         # Board-specific components
│   ├── column/        # Column management components
│   ├── task/          # Task management components
│   ├── layout/        # Layout components (Header)
│   ├── sharing/       # Board sharing components
│   └── collaboration/ # Real-time collaboration components
├── pages/             # Page components
├── store/             # Zustand state management
├── api/               # API and Socket.io services
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── styles/            # CSS and styling
```

### Backend (Node.js + Express + TypeScript)

```
backend/
├── models/            # MongoDB schemas and models
├── routes/            # Express route handlers
├── middleware/        # Custom middleware (auth, validation)
├── services/          # Business logic services
└── index.ts          # Main server entry point
```

## 🛠️ Technology Stack

### Frontend

- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Zustand**: Lightweight state management
- **React Router**: Client-side routing
- **Socket.io Client**: Real-time communication
- **@dnd-kit**: Drag and drop functionality
- **Lucide React**: Beautiful icon library
- **React Hot Toast**: Toast notifications
- **React Markdown**: Markdown rendering

### Backend

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: Type-safe development
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Socket.io**: Real-time bidirectional communication
- **JWT**: JSON Web Token authentication
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin resource sharing
- **UUID**: Unique identifier generation

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Nodemon**: Development server with auto-restart
- **ts-node**: TypeScript execution

## 📁 Project Structure

### Frontend Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx          # Reusable button component
│   │   ├── Modal.tsx           # Modal dialog component
│   │   ├── Dropdown.tsx        # Dropdown select component
│   │   ├── Avatar.tsx          # User avatar component
│   │   └── Tag.tsx             # Priority/status tags
│   ├── board/
│   │   └── BoardColumns.tsx    # Main board layout with drag-drop
│   ├── column/
│   │   └── Column.tsx          # Individual column component
│   ├── task/
│   │   └── TaskCard.tsx        # Individual task card
│   ├── layout/
│   │   └── Header.tsx          # Application header
│   ├── sharing/
│   │   └── ShareBoard.tsx      # Board sharing interface
│   └── collaboration/
│       ├── ActiveUsers.tsx     # Active users display
│       ├── ConnectionStatus.tsx # Connection status indicator
│       └── EditingIndicator.tsx # User editing indicators
├── pages/
│   ├── BoardList.tsx           # Board listing page
│   ├── BoardDetail.tsx         # Individual board view
│   ├── Login.tsx               # Authentication page
│   ├── Signup.tsx              # Registration page
│   ├── Profile.tsx             # User profile page
│   └── InviteAccept.tsx        # Invite link acceptance
├── store/
│   ├── useAuthStore.ts         # Authentication state
│   ├── useBoardStore.ts        # Board and task state
│   ├── useSharingStore.ts      # Board sharing state
│   ├── useCollaborationStore.ts # Real-time collaboration state
│   └── useSearchStore.ts       # Search functionality state
├── api/
│   ├── index.ts                # REST API client
│   └── socket.ts               # Socket.io client service
├── types/
│   └── index.ts                # TypeScript type definitions
├── utils/
│   └── index.ts                # Utility functions
├── App.tsx                     # Main application component
├── main.tsx                    # Application entry point
└── index.css                   # Global styles
```

### Backend Structure

```
backend/
├── models/
│   ├── User.ts                 # User model and schema
│   └── Board.ts                # Board model with sharing fields
├── routes/
│   ├── auth.ts                 # Authentication routes
│   ├── board.ts                # Board CRUD routes
│   ├── user.ts                 # User management routes
│   └── sharing.ts              # Board sharing routes
├── middleware/
│   └── auth.ts                 # JWT authentication middleware
├── services/
│   └── sharingService.ts       # Board sharing business logic
├── index.ts                    # Main server with Socket.io
├── package.json                # Backend dependencies
└── tsconfig.json               # TypeScript configuration
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB 5+
- npm or yarn

### Environment Variables

Create `.env` files in both root and backend directories:

**Frontend (.env)**

```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env)**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskboard
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### Installation Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd task-board
```

2. **Install frontend dependencies**

```bash
npm install
```

3. **Install backend dependencies**

```bash
cd backend
npm install
```

4. **Start MongoDB**

```bash
# Make sure MongoDB is running on your system
mongod
```

5. **Start the backend server**

```bash
cd backend
npm run dev
```

6. **Start the frontend development server**

```bash
# In a new terminal, from the root directory
npm run dev
```

7. **Access the application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🎯 Core Features Deep Dive

### 1. Real-Time Collaboration

**Socket.io Integration**

- WebSocket connection for real-time updates
- Room-based broadcasting for board-specific events
- User presence tracking and activity indicators
- Automatic reconnection handling

**Real-Time Events**

- Task creation, updates, deletion, and movement
- Column creation, updates, deletion, and reordering
- User join/leave notifications
- Editing indicators for concurrent editing

**Implementation Details**

```typescript
// Socket service for real-time communication
class SocketService {
  private socket: Socket | null = null;
  private currentBoardId: string | null = null;

  connect(token: string): Promise<void> {
    // Establish WebSocket connection with JWT authentication
  }

  joinBoard(boardId: string): void {
    // Join board-specific room for targeted updates
  }

  emitTaskUpdated(taskId: string, task: any): void {
    // Emit task updates to all board members
  }
}
```

### 2. Board Sharing & Access Control

**Role-Based Permissions**

- **Owner**: Full access to everything (board creator)
- **Admin**: Can edit, delete, and manage members
- **Editor**: Can edit tasks and columns
- **Viewer**: Can only view the board

**Permission Matrix**

```typescript
const permissions = {
  owner: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canInvite: true,
    canManageMembers: true,
  },
  admin: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canInvite: true,
    canManageMembers: true,
  },
  editor: {
    canView: true,
    canEdit: true,
    canDelete: false,
    canInvite: false,
    canManageMembers: false,
  },
  viewer: {
    canView: true,
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canManageMembers: false,
  },
};
```

**Invite Link System**

- JWT-based secure invite tokens
- Role assignment during invite creation
- Expiration dates and usage limits
- Automatic board joining via invite URLs

### 3. Drag & Drop Interface

**@dnd-kit Implementation**

- Smooth drag and drop for tasks and columns
- Visual feedback during drag operations
- Collision detection and drop zones
- Accessibility support

**Key Features**

- Task reordering within columns
- Task movement between columns
- Column reordering
- Drag overlay for visual feedback

### 4. State Management

**Zustand Stores**

- **useAuthStore**: Authentication state and user management
- **useBoardStore**: Board, column, and task state with real-time handlers
- **useSharingStore**: Board sharing and member management
- **useCollaborationStore**: Real-time collaboration state
- **useSearchStore**: Global search functionality

**State Persistence**

- Local storage persistence for boards and user data
- Automatic state restoration on app reload
- Real-time state synchronization across users

## 🔒 Security Features

### Authentication

- JWT token-based authentication
- Secure password hashing with bcrypt
- Token expiration and refresh handling
- Protected route middleware

### Authorization

- Role-based access control (RBAC)
- Permission-based UI rendering
- Server-side permission validation
- Secure invite link generation

### Data Protection

- Input validation and sanitization
- CORS configuration for cross-origin requests
- MongoDB injection prevention
- XSS protection through React's built-in escaping

## 🎨 UI/UX Design

### Design System

- **Color Palette**: Primary indigo, secondary zinc, accent emerald
- **Typography**: Inter for body text, Sora for headings
- **Spacing**: Consistent 4px grid system
- **Components**: Reusable UI components with variants

### Responsive Design

- Mobile-first approach
- Breakpoint-based responsive layouts
- Touch-friendly drag and drop
- Adaptive navigation and menus

### Dark Mode

- System preference detection
- Manual theme toggle
- Consistent color scheme across themes
- Smooth theme transitions

### Animations

- Framer Motion for smooth transitions
- Loading states and feedback
- Hover effects and micro-interactions
- Drag and drop visual feedback

## 📊 Performance Optimizations

### Frontend

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large task lists
- **Debounced Search**: Optimized search performance

### Backend

- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Redis for session and data caching
- **Connection Pooling**: MongoDB connection management
- **Rate Limiting**: API rate limiting protection

### Real-Time

- **Event Batching**: Batch multiple updates
- **Room-based Broadcasting**: Targeted event emission
- **Connection Management**: Efficient WebSocket handling
- **Heartbeat System**: Connection health monitoring

## 🚀 Deployment

### Frontend Deployment (Vercel)

```bash
# Build the application
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend Deployment (Render)

```bash
# Set environment variables in Render dashboard
# Deploy from GitHub repository
```

### Environment Configuration

```env
# Production Environment Variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=production-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

## 🧪 Testing

### Frontend Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### Backend Testing

```bash
# Run API tests
npm test

# Run database tests
npm run test:db
```

## 📈 Monitoring & Analytics

### Error Tracking

- Sentry integration for error monitoring
- Performance monitoring
- User session tracking

### Analytics

- User engagement metrics
- Board usage statistics
- Real-time collaboration metrics

## 🔧 Development Workflow

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript strict mode
- Pre-commit hooks

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create pull request
# Code review and merge
```

### Database Migrations

```javascript
// MongoDB migration script
db.boards.updateMany(
  {},
  {
    $set: {
      isPublic: false,
      members: [],
      inviteLinks: [],
      settings: {
        allowGuestAccess: false,
        requireApproval: false,
        defaultRole: "viewer",
      },
    },
  }
);
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Standards

- Follow TypeScript best practices
- Use meaningful commit messages
- Write comprehensive documentation
- Include unit tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Node.js](https://nodejs.org/) - Backend runtime
- [MongoDB](https://www.mongodb.com/) - Database
- [Socket.io](https://socket.io/) - Real-time communication
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [@dnd-kit](https://dndkit.com/) - Drag and drop library

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

**TaskBoard** - Empowering teams with real-time collaboration and intuitive task management.
