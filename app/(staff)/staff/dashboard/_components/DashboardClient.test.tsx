import { render, screen, waitFor } from '@testing-library/react';
import DashboardClient from './DashboardClient';
import { vi } from 'vitest';

// Mock Modules
vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: { user: { name: 'Test User', role: 'STAFF' } },
        status: 'authenticated'
    })
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() })
}));

// Mock Fetch
global.fetch = vi.fn();

describe('DashboardClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as any).mockResolvedValue({
            json: async () => ({
                studentStats: { total: 100 },
                opsStats: { pendingApps: 5 },
                teamStats: { total: 10 },
                recentStudents: [],
                calendarEvents: [],
                windowTracker: null,
                attendance: { instructorRate: 99, studentRate: 85 }
            })
        });
    });

    it('renders welcome message', async () => {
        render(<DashboardClient />);
        await waitFor(() => expect(screen.getByText(/Welcome, Test!/i)).toBeInTheDocument());
    });

    it('displays stats correctly', async () => {
        render(<DashboardClient />);
        await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument()); // Total Students
        expect(screen.getByText('5')).toBeInTheDocument(); // Pending Apps
    });
});
