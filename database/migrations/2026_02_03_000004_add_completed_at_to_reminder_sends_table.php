<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reminder_sends', function (Blueprint $table) {
            $table->timestamp('completed_at_utc')->nullable()->after('attempted_at_utc');
        });
    }

    public function down(): void
    {
        Schema::table('reminder_sends', function (Blueprint $table) {
            $table->dropColumn('completed_at_utc');
        });
    }
};
