<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('ai_summary_logs')) {
            Schema::create('ai_summary_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->default(1);
                $table->json('insights_generated')->nullable();
                $table->timestamp('generated_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('notification_flags')) {
            Schema::create('notification_flags', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->default(1);
                $table->string('type'); // e.g. 'invoice_overdue'
                $table->string('severity')->default('warning'); // 'critical', 'warning'
                $table->string('message');
                $table->boolean('is_seen')->default(false);
                $table->string('reference_table')->nullable();
                $table->string('reference_id')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_summary_logs');
        Schema::dropIfExists('notification_flags');
    }
};
