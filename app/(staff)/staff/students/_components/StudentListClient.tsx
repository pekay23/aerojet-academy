"use client";

import React from 'react';
import UserListClient from '../../users/_components/UserListClient'; 

export default function StudentListClient() {
  // ✅ Pass the initial filter
  return <UserListClient initialFilter="students" />;
}