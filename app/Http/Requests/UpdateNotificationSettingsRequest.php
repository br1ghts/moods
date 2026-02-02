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
            'preferred_time' => ['nullable', 'date_format:H:i', 'required_if:cadence,daily,weekly'],
            'preferred_weekday' => ['nullable', 'integer', 'between:0,6', 'required_if:cadence,weekly'],
            'timezone' => ['required', 'timezone'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $cadence = $this->input('cadence');
        $preferredTime = $this->input('preferred_time');
        $preferredWeekday = $this->input('preferred_weekday');

        if (is_string($preferredTime)) {
            $trimmed = trim($preferredTime);
            if ($trimmed === '') {
                $preferredTime = null;
            } elseif (preg_match('/^\d{2}:\d{2}:\d{2}$/', $trimmed) === 1) {
                $preferredTime = substr($trimmed, 0, 5);
            } else {
                $preferredTime = $trimmed;
            }
        }

        if ($cadence === 'hourly') {
            $preferredTime = null;
            $preferredWeekday = null;
        } elseif ($cadence === 'daily') {
            $preferredWeekday = null;
        }

        $this->merge([
            'preferred_time' => $preferredTime,
            'preferred_weekday' => $preferredWeekday,
        ]);
    }
}
