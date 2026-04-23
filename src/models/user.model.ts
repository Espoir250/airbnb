export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone: string;
  role: "host" | "guest";
  avatar?: string;
  bio?: string;
}

export const users: User[] = [
  {
    id: 1,
    name: "Amina Uwase",
    email: "amina@example.com",
    username: "aminahost",
    phone: "0791256767",
    role: "host",
    
    bio: "Friendly host with a cozy apartment in Nairobi."
  },
  {
    id: 2,
    name: "Daniel Nahimana",
    email: "daniel@example.com",
    username: "danahimana",
    phone: "0787432319",
    role: "guest",
    bio: "Weekend traveler who loves scenic stays."
  },
  {
    id: 3,
    name: "Grace Uwimana",
    email: "grace@example.com",
    username: "gracehomes",
    phone: "0796543210",
    role: "host",
    
    bio: "Hosting stylish homes near the city center."
  }
];

