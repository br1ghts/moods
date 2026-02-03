<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mood;
use App\Models\MoodEntry;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MoodLogApiController extends Controller
{
    private const NOTE_MAX_LENGTH = 500;
    private const TOKEN_MIN_LENGTH = 32;

    public function logFromPath(Request $request, string $token, string $moodKey)
    {
        $note = $request->query('note');
        $intensity = $request->query('intensity');

        return $this->handleLog($request, $token, $moodKey, $note, $intensity);
    }

    public function logFromBearer(Request $request)
    {
        $token = $request->bearerToken();

        if (! $token) {
            return $this->errorResponse('invalid_token', 'Missing API token.', 401);
        }

        $moodKey = $request->input('mood');
        $note = $request->input('note');
        $intensity = $request->input('intensity');

        return $this->handleLog($request, $token, $moodKey, $note, $intensity);
    }

    private function handleLog(Request $request, string $token, ?string $moodKey, ?string $note, $intensityInput)
    {
        if (strlen($token) < self::TOKEN_MIN_LENGTH) {
            return $this->errorResponse('invalid_token', 'Invalid API token.', 401);
        }

        $user = $this->userFromToken($token);

        if (! $user) {
            return $this->errorResponse('invalid_token', 'Invalid API token.', 401);
        }

        if (! $user->api_enabled) {
            return $this->errorResponse('api_disabled', 'API access disabled for this account.', 403);
        }

        if (! $moodKey) {
            return $this->errorResponse('missing_mood', 'Mood key is required.', 400);
        }

        [$resolvedMoodKey, $pathNote] = $this->splitMoodKeyAndNote($moodKey);

        $note = $note ?? $pathNote;

        if (is_string($note)) {
            $note = trim($note);
            if ($note === '') {
                $note = null;
            } else {
                $note = Str::limit($note, self::NOTE_MAX_LENGTH, '');
            }
        } else {
            $note = null;
        }

        $intensity = $this->resolveIntensity($intensityInput);

        if ($intensity === null) {
            return $this->errorResponse('invalid_intensity', 'Intensity must be an integer between 1 and 5.', 400);
        }

        $mood = Mood::where('key', $resolvedMoodKey)
            ->where('is_active', true)
            ->first();

        if (! $mood) {
            return $this->errorResponse('unknown_mood', 'Unknown mood key.', 400);
        }

        $entry = $user->moodEntries()->create([
            'mood_id' => $mood->id,
            'intensity' => $intensity,
            'notes' => $note,
            'occurred_at' => Carbon::now('UTC'),
        ]);

        Log::info('api_mood_log', [
            'user_id' => $user->id,
            'mood_key' => $resolvedMoodKey,
            'entry_id' => $entry->id,
            'status' => 'success',
        ]);

        return response()->json([
            'ok' => true,
            'entry_id' => $entry->id,
            'mood' => [
                'key' => $mood->key,
                'label' => $mood->label,
            ],
            'note' => $note,
            'occurred_at' => $entry->occurred_at?->copy()->utc()->toIso8601String(),
        ]);
    }

    private function splitMoodKeyAndNote(string $moodKey): array
    {
        $parts = explode('+', $moodKey, 2);
        $key = $parts[0];
        $note = $parts[1] ?? null;

        if ($note !== null) {
            $note = str_replace('+', ' ', $note);
            $note = rawurldecode($note);
        }

        return [$key, $note];
    }

    private function resolveIntensity($intensityInput): ?int
    {
        if ($intensityInput === null || $intensityInput === '') {
            return 3;
        }

        if (! is_numeric($intensityInput)) {
            return null;
        }

        $intensity = (int) $intensityInput;

        if ($intensity < 1 || $intensity > 5) {
            return null;
        }

        return $intensity;
    }

    private function userFromToken(string $token): ?User
    {
        $hash = hash('sha256', $token);
        $user = User::where('api_token_hash', $hash)->first();

        if (! $user) {
            return null;
        }

        if (! hash_equals($user->api_token_hash, $hash)) {
            return null;
        }

        return $user;
    }

    private function errorResponse(string $code, string $message, int $status)
    {
        Log::warning('api_mood_log', [
            'status' => 'error',
            'error' => $code,
        ]);

        return response()->json([
            'ok' => false,
            'error' => $code,
            'message' => $message,
        ], $status);
    }
}
