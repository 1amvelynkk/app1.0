
export enum Tab {
  Workspace = 'workspace',
  Organization = 'organization',
  AI = 'ai',
  Project = 'project',
  My = 'my',
}

export enum ProjectStatus {
  Ongoing = 'ongoing',
  Todo = 'todo',
  Delayed = 'delayed',
  Done = 'done'
}

export interface Project {
  id: string;
  title: string;
  manager: string;
  manager_id?: string; // Added for permission checks
  department?: string;
  status: string;
  progress: number;
  deadline: string;
  color?: string; // Brand color
  membersCount?: number;
  members?: any[];
  milestones?: any[]; // For urgent logic
  tags?: string[];
  description?: string;
  role?: string;
  hasPermission?: boolean;
  visibility?: string;
  estimatedHours?: number; // Total planned hours for the project
}

export interface User {
  name: string;
  role: string;
  department: string;
  avatar: string;
  stats: {
    completedProjects: number;
    hours: number;
    efficiency: number;
  };
}

export interface Member {
  id: string;
  name: string;
  role: string;
  title: string;
  dept: string;
  projectCount: number;
  status: 'online' | 'offline' | 'busy';
  tags: string[];
  avatar: string;
  joinDays: number;
  projects?: { id: string; title: string; role: string }[];
}

export interface Department {
  id: string;
  name: string;
  enName: string;
  count: string;
  level: number;
  children?: Department[];
  members: Member[];
}

export interface ProjectActivity {
  id: string;
  userName: string;
  userAvatar: string;
  action: string;
  target: string;
  projectTitle: string;
  projectId: string;
  time: string;
  type: 'invite' | 'upload' | 'review' | 'task' | 'ai';
  category?: 'alert' | 'update' | 'ai'; // Added for styling
}

export interface ProjectRating {
  id: string;
  project_id: string;
  rater_id: string;
  ratee_id: string;
  score: number;
  comment?: string;
  created_at: string;
}
