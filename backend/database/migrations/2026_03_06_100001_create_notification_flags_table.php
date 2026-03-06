<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('alert_type');
            $table->bigInteger('reference_id')->nullable();
            $table->string('reference_table')->nullable();
            $table->enum('severity', ['critical', 'warning', 'info']);
            $table->text('message');
            $table->boolean('is_seen')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_flags');
    }
};
