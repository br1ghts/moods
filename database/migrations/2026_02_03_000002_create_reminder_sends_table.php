<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reminder_sends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('bucket_key');
            $table->timestamp('due_at_utc');
            $table->timestamp('attempted_at_utc')->nullable();
            $table->string('status');
            $table->text('failure_reason')->nullable();
            $table->unsignedInteger('devices_targeted')->default(0);
            $table->unsignedInteger('devices_succeeded')->default(0);
            $table->unsignedInteger('devices_failed')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['user_id', 'bucket_key']);
            $table->index(['status', 'due_at_utc']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminder_sends');
    }
};
