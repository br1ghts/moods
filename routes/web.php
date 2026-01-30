<?php

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
    Route::get('/push/vapid-public-key', [PushController::class, 'vapidPublicKey'])->name('push.vapid-public-key');
    Route::post('/push/test', [PushController::class, 'test'])->name('push.test');
});

require __DIR__.'/auth.php';
