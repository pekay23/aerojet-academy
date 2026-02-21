import React from 'react';
import UserListClient from './_components/UserListClient';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">User Directory</h1>
      </div>
      <UserListClient />
    </div>
  );
}
