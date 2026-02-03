<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminEmotionsController;
use App\Http\Controllers\Admin\AdminMembersController;
use App\Http\Controllers\Admin\AdminRemindersController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\InsightsController;
use App\Http\Controllers\MoodEntryController;
use App\Http\Controllers\PushController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Landing', [
        'googleRedirect' => route('auth.google'),
    ]);
})->name('landing');

Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');

Route::middleware('auth')->group(function () {
    Route::get('/log', [MoodEntryController::class, 'log'])->name('log');
    Route::post('/mood-entries', [MoodEntryController::class, 'store'])->name('mood-entries.store');
    Route::delete('/mood-entries/{moodEntry}', [MoodEntryController::class, 'destroy'])->name('mood-entries.destroy');
    Route::get('/history', [MoodEntryController::class, 'history'])->name('history');
    Route::get('/insights', [InsightsController::class, 'index'])->name('insights');
    Route::get('/api/insights', [InsightsController::class, 'data'])->name('insights.data');
    Route::get('/settings', [SettingsController::class, 'edit'])->name('settings');
    Route::put('/settings/notifications', [SettingsController::class, 'update'])->name('settings.notifications.update');
    Route::post('/push/subscribe', [PushController::class, 'subscribe'])->name('push.subscribe');
    Route::delete('/push/unsubscribe', [PushController::class, 'unsubscribe'])->name('push.unsubscribe');
    Route::get('/push/subscriptions', [PushController::class, 'index'])->name('push.subscriptions.index');
    Route::delete('/push/subscriptions/{pushSubscription}', [PushController::class, 'destroy'])->name('push.subscriptions.destroy');
    Route::get('/push/vapid-public-key', [PushController::class, 'vapidPublicKey'])->name('push.vapid-public-key');
    Route::post('/push/test', [PushController::class, 'test'])->name('push.test');
});

Route::middleware(['auth', 'admin.email'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::get('/members', [AdminMembersController::class, 'index'])->name('members.index');
        Route::get('/members/{user}', [AdminMembersController::class, 'show'])->name('members.show');
        Route::patch('/members/{user}/toggle', [AdminMembersController::class, 'toggle'])->name('members.toggle');
        Route::delete('/members/{user}/push-subscriptions', [AdminMembersController::class, 'revokePushDevices'])->name('members.push.revoke');
        Route::get('/reminders', [AdminRemindersController::class, 'index'])->name('reminders');
        Route::get('/reminders/users/{user}', [AdminRemindersController::class, 'showUser'])->name('reminders.user');
        Route::post('/reminders/tick', [AdminRemindersController::class, 'runTick'])->name('reminders.tick');
        Route::post('/reminders/simulate', [AdminRemindersController::class, 'simulateDueNow'])->name('reminders.simulate');
        Route::get('/emotions', [AdminEmotionsController::class, 'index'])->name('emotions.index');
        Route::get('/emotions/create', [AdminEmotionsController::class, 'create'])->name('emotions.create');
        Route::post('/emotions', [AdminEmotionsController::class, 'store'])->name('emotions.store');
        Route::get('/emotions/{emotion}/edit', [AdminEmotionsController::class, 'edit'])->name('emotions.edit');
        Route::put('/emotions/{emotion}', [AdminEmotionsController::class, 'update'])->name('emotions.update');
        Route::patch('/emotions/{emotion}/toggle', [AdminEmotionsController::class, 'toggle'])->name('emotions.toggle');
        Route::get('/emotions/export', [AdminEmotionsController::class, 'export'])->name('emotions.export');
        Route::post('/emotions/import', [AdminEmotionsController::class, 'import'])->name('emotions.import');
    });

require __DIR__.'/auth.php';
