<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            $table->boolean('test_mode_enabled')->default(false)->after('enabled');
            $table->unsignedSmallInteger('test_interval_seconds')->nullable()->after('test_mode_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            $table->dropColumn(['test_mode_enabled', 'test_interval_seconds']);
        });
    }
};
