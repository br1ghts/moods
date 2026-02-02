<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AdminMembersController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->trim()->value();

        $query = User::query()
            ->withCount(['moodEntries', 'pushSubscriptions'])
            ->orderByDesc('created_at');

        if ($search !== '') {
            $query->where(function ($inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $members = $query->paginate(25)->withQueryString();

        $memberData = $members->getCollection()->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'created_at' => $user->created_at?->toIso8601String(),
            'mood_entries_count' => $user->mood_entries_count,
            'push_devices_count' => $user->push_subscriptions_count,
            'is_disabled' => $user->is_disabled,
        ]);

        return Inertia::render('Admin/Members/Index', [
            'filters' => [
                'search' => $search,
            ],
            'members' => $memberData,
            'pagination' => [
                'current_page' => $members->currentPage(),
                'last_page' => $members->lastPage(),
                'next_page_url' => $members->nextPageUrl(),
                'prev_page_url' => $members->previousPageUrl(),
            ],
        ]);
    }

    public function show(User $user)
    {
        $user->loadCount(['moodEntries', 'pushSubscriptions']);

        return Inertia::render('Admin/Members/Show', [
            'member' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at?->toIso8601String(),
                'mood_entries_count' => $user->mood_entries_count,
                'push_devices_count' => $user->push_subscriptions_count,
                'is_disabled' => $user->is_disabled,
            ],
        ]);
    }

    public function toggle(User $user)
    {
        if ($user->email === 'brendonbaughray@gmail.com') {
            return redirect()
                ->back()
                ->with('error', 'Admin access cannot be disabled.');
        }

        $user->update([
            'is_disabled' => ! $user->is_disabled,
        ]);

        if ($user->is_disabled) {
            $this->invalidateSessions($user);
        }

        $status = $user->is_disabled ? 'disabled' : 'enabled';

        return redirect()
            ->back()
            ->with('success', "Member {$status}.");
    }

    public function revokePushDevices(User $user)
    {
        PushSubscription::where('user_id', $user->id)->delete();

        return redirect()
            ->back()
            ->with('success', 'Push devices revoked.');
    }

    protected function invalidateSessions(User $user): void
    {
        if (! Schema::hasTable('sessions')) {
            return;
        }

        DB::table('sessions')->where('user_id', $user->id)->delete();
    }
}
