<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            $table->time('daily_time')->nullable()->after('cadence');
            $table->tinyInteger('weekly_day')->nullable()->after('daily_time');
            $table->timestamp('next_due_at')->nullable()->after('last_sent_at');
        });

        if (Schema::hasColumn('notification_settings', 'preferred_time')) {
            DB::table('notification_settings')->update([
                'daily_time' => DB::raw('preferred_time'),
            ]);
        }

        if (Schema::hasColumn('notification_settings', 'preferred_weekday')) {
            DB::table('notification_settings')->update([
                'weekly_day' => DB::raw('preferred_weekday'),
            ]);
        }

        if (Schema::hasColumn('notification_settings', 'next_reminder_at')) {
            DB::table('notification_settings')->update([
                'next_due_at' => DB::raw('next_reminder_at'),
            ]);
        }

        Schema::table('notification_settings', function (Blueprint $table) {
            if (Schema::hasColumn('notification_settings', 'preferred_time')) {
                $table->dropColumn('preferred_time');
            }
            if (Schema::hasColumn('notification_settings', 'preferred_weekday')) {
                $table->dropColumn('preferred_weekday');
            }
            if (Schema::hasColumn('notification_settings', 'next_reminder_at')) {
                $table->dropColumn('next_reminder_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('notification_settings', function (Blueprint $table) {
            $table->time('preferred_time')->nullable()->after('cadence');
            $table->tinyInteger('preferred_weekday')->nullable()->after('preferred_time');
            $table->timestamp('next_reminder_at')->nullable()->after('last_sent_at');
        });

        if (Schema::hasColumn('notification_settings', 'daily_time')) {
            DB::table('notification_settings')->update([
                'preferred_time' => DB::raw('daily_time'),
            ]);
        }

        if (Schema::hasColumn('notification_settings', 'weekly_day')) {
            DB::table('notification_settings')->update([
                'preferred_weekday' => DB::raw('weekly_day'),
            ]);
        }

        if (Schema::hasColumn('notification_settings', 'next_due_at')) {
            DB::table('notification_settings')->update([
                'next_reminder_at' => DB::raw('next_due_at'),
            ]);
        }

        Schema::table('notification_settings', function (Blueprint $table) {
            if (Schema::hasColumn('notification_settings', 'daily_time')) {
                $table->dropColumn('daily_time');
            }
            if (Schema::hasColumn('notification_settings', 'weekly_day')) {
                $table->dropColumn('weekly_day');
            }
            if (Schema::hasColumn('notification_settings', 'next_due_at')) {
                $table->dropColumn('next_due_at');
            }
        });
    }
};
