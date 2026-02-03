<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'enabled' => ['required', 'boolean'],
            'cadence' => ['required', 'in:hourly,daily,weekly'],
            'daily_time' => ['nullable', 'date_format:H:i', 'required_if:cadence,daily,weekly'],
            'weekly_day' => ['nullable', 'integer', 'between:0,6', 'required_if:cadence,weekly'],
            'timezone' => ['required', 'timezone'],
            'test_mode_enabled' => ['nullable', 'boolean'],
            'test_interval_seconds' => ['nullable', 'integer', 'in:30,60', 'required_if:test_mode_enabled,1'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $cadence = $this->input('cadence');
        $dailyTime = $this->input('daily_time');
        $weeklyDay = $this->input('weekly_day');
        $testModeEnabled = $this->boolean('test_mode_enabled');
        $testIntervalSeconds = $this->input('test_interval_seconds');

        if (is_string($dailyTime)) {
            $trimmed = trim($dailyTime);
            if ($trimmed === '') {
                $dailyTime = null;
            } elseif (preg_match('/^\d{2}:\d{2}:\d{2}$/', $trimmed) === 1) {
                $dailyTime = substr($trimmed, 0, 5);
            } else {
                $dailyTime = $trimmed;
            }
        }

        if ($cadence === 'hourly') {
            $dailyTime = null;
            $weeklyDay = null;
        } elseif ($cadence === 'daily') {
            $weeklyDay = null;
        }

        $isAdmin = $this->user()?->email === 'brendonbaughray@gmail.com';

        if (! $isAdmin) {
            $testModeEnabled = false;
            $testIntervalSeconds = null;
        } elseif (! $testModeEnabled) {
            $testIntervalSeconds = null;
        }

        $this->merge([
            'daily_time' => $dailyTime,
            'weekly_day' => $weeklyDay,
            'test_mode_enabled' => $testModeEnabled,
            'test_interval_seconds' => $testIntervalSeconds,
        ]);
    }
}
