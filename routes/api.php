<?php

use App\Http\Controllers\Api\MoodLogApiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['throttle:20,1'])->group(function () {
    Route::get('/{token}/log/{moodKey}', [MoodLogApiController::class, 'logFromPath']);
    Route::get('/{token}/list', [MoodLogApiController::class, 'listMoods']);
    Route::post('/log', [MoodLogApiController::class, 'logFromBearer']);
});
