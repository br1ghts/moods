<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('push_subscriptions', function (Blueprint $table) {
            $table->timestamp('last_push_at')->nullable()->after('last_seen_at');
            $table->text('last_push_error')->nullable()->after('last_push_at');
        });
    }

    public function down(): void
    {
        Schema::table('push_subscriptions', function (Blueprint $table) {
            $table->dropColumn(['last_push_at', 'last_push_error']);
        });
    }
};

