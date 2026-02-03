<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('api_token_encrypted')->nullable()->after('remember_token');
            $table->string('api_token_hash', 64)->nullable()->unique()->after('api_token_encrypted');
            $table->boolean('api_enabled')->default(true)->after('api_token_hash');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['api_token_hash']);
            $table->dropColumn(['api_token_encrypted', 'api_token_hash', 'api_enabled']);
        });
    }
};
