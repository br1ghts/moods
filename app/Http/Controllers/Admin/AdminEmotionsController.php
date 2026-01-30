<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mood;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminEmotionsController extends Controller
{
    public function index()
    {
        $emotions = Mood::orderBy('sort_order')
            ->orderBy('label')
            ->get(['id', 'key', 'label', 'emoji', 'color', 'sort_order', 'is_active']);

        return Inertia::render('Admin/Emotions/Index', [
            'emotions' => $emotions,
        ]);
    }

    public function export()
    {
        $emotions = Mood::orderBy('sort_order')
            ->orderBy('label')
            ->get(['label', 'key', 'emoji', 'color', 'sort_order', 'is_active']);

        $callback = function () use ($emotions) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['label', 'key', 'emoji', 'color', 'sort_order', 'is_active']);

            foreach ($emotions as $emotion) {
                fputcsv($handle, [
                    $emotion->label,
                    $emotion->key,
                    $emotion->emoji,
                    $emotion->color,
                    $emotion->sort_order,
                    (int) $emotion->is_active,
                ]);
            }

            fclose($handle);
        };

        return response()->streamDownload($callback, 'emotions.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'csv' => ['required', 'file', 'mimes:csv,txt'],
        ]);

        $file = $request->file('csv');
        $handle = fopen($file->getRealPath(), 'r');

        if (! $handle) {
            return redirect()
                ->back()
                ->with('success', 'Unable to read uploaded file.');
        }

        $header = null;
        $line = 0;
        $processed = 0;
        $created = 0;
        $updated = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $line++;

            if ($line === 1) {
                $header = array_map(fn ($column) => strtolower(str_replace("\xEF\xBB\xBF", '', trim($column ?? ''))), $row);
                continue;
            }

            if (! $header || count($row) !== count($header)) {
                $skipped++;
                continue;
            }

            $payload = array_combine($header, $row);

            if (! $payload) {
                $skipped++;
                continue;
            }

            $payload = array_map(fn ($value) => is_string($value) ? trim($value) : $value, $payload);

            if (! isset($payload['label']) || ! isset($payload['key']) || $payload['label'] === '' || $payload['key'] === '') {
                $skipped++;
                continue;
            }

            $payload['key'] = Str::slug($payload['key']);

            if ($payload['key'] === '') {
                $skipped++;
                continue;
            }

            if (($payload['sort_order'] ?? '') === '') {
                unset($payload['sort_order']);
            }

            $emotion = Mood::where('key', $payload['key'])->first();

            try {
                $attributes = $this->prepareAttributesFromArray($payload, $emotion);
            } catch (ValidationException) {
                $skipped++;
                continue;
            }

            if ($emotion) {
                $emotion->update($attributes);
                $updated++;
            } else {
                Mood::create($attributes);
                $created++;
            }

            $processed++;
        }

        fclose($handle);

        $message = "Import complete: {$processed} rows processed, {$created} new, {$updated} updated, {$skipped} skipped.";

        return redirect()
            ->back()
            ->with('success', $message);
    }

    public function create()
    {
        return Inertia::render('Admin/Emotions/Form', [
            'emotion' => null,
        ]);
    }

    public function store(Request $request)
    {
        $attributes = $this->validatedAttributes($request);

        Mood::create($attributes);

        return redirect()
            ->route('admin.emotions.index')
            ->with('success', 'Emotion added.');
    }

    public function edit(Mood $emotion)
    {
        return Inertia::render('Admin/Emotions/Form', [
            'emotion' => $emotion,
        ]);
    }

    public function update(Request $request, Mood $emotion)
    {
        $attributes = $this->validatedAttributes($request, $emotion);

        $emotion->update($attributes);

        return redirect()
            ->route('admin.emotions.index')
            ->with('success', 'Emotion updated.');
    }

    public function toggle(Mood $emotion)
    {
        $emotion->update([
            'is_active' => ! $emotion->is_active,
        ]);

        $status = $emotion->is_active ? 'enabled' : 'disabled';

        return redirect()
            ->route('admin.emotions.index')
            ->with('success', "Emotion {$status}.");
    }

    private function validatedAttributes(Request $request, Mood $emotion = null): array
    {
        return $this->prepareAttributesFromArray($request->all(), $emotion);
    }

    private function prepareAttributesFromArray(array $payload, Mood $emotion = null): array
    {
        if (isset($payload['key'])) {
            $payload['key'] = Str::slug($payload['key']);
        }

        $validator = Validator::make($payload, $this->rules($emotion));
        $data = $validator->validate();

        $sortOrder = $data['sort_order'] ?? null;

        if (is_null($sortOrder)) {
            if ($emotion) {
                $sortOrder = $emotion->sort_order;
            } else {
                $sortOrder = $this->nextSortOrder();
            }
        }

        $emoji = trim($data['emoji'] ?? '');
        $color = trim($data['color'] ?? '');

        return [
            'label' => $data['label'],
            'key' => $data['key'],
            'emoji' => $emoji !== '' ? $emoji : ($emotion?->emoji ?? '🙂'),
            'color' => $color !== '' ? $color : ($emotion?->color ?? 'slate'),
            'sort_order' => (int) $sortOrder,
            'is_active' => $this->toBoolean($data['is_active'] ?? null, $emotion?->is_active ?? true),
        ];
    }

    private function rules(Mood $emotion = null): array
    {
        return [
            'label' => ['required', 'string', 'max:255'],
            'key' => [
                'required',
                'string',
                'max:255',
                Rule::unique('moods', 'key')->ignore($emotion?->id),
            ],
            'emoji' => ['nullable', 'string', 'max:10'],
            'color' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    private function toBoolean($value, bool $default): bool
    {
        if (is_null($value)) {
            return $default;
        }

        $converted = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        return $converted ?? $default;
    }

    private function nextSortOrder(): int
    {
        $max = Mood::max('sort_order');

        if (is_null($max)) {
            return 1;
        }

        return $max + 1;
    }
}
