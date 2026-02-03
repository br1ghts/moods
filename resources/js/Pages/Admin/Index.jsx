import { AdminLink } from '@/Components/Admin/AdminButton';
import AdminCard from '@/Components/Admin/AdminCard';
import StatCard from '@/Components/Admin/StatCard';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminIndex({ emotionCount, memberCount, activeMemberCount, moodEntryCount, pushDeviceCount }) {
    const stats = [
        { label: 'Total moods', value: emotionCount },
        { label: 'Total members', value: memberCount },
        { label: 'Active members', value: activeMemberCount },
        { label: 'Mood entries', value: moodEntryCount },
        { label: 'Push devices', value: pushDeviceCount },
    ].filter((stat) => stat.value !== null && stat.value !== undefined);

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <AdminCard>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Overview</p>
                        </div>

                    </div>

                    {stats.length > 0 && (
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {stats.map((stat) => (
                                <StatCard key={stat.label} label={stat.label} value={stat.value} />
                            ))}
                        </div>
                    )}
                </AdminCard>


            </div>
        </AdminLayout>
    );
}
