<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMoodEntryRequest extends FormRequest
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
            'mood_id' => ['required', 'exists:moods,id'],
            'intensity' => ['nullable', 'integer', 'between:1,5'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'occurred_at' => ['nullable', 'date'],
        ];
    }
}
