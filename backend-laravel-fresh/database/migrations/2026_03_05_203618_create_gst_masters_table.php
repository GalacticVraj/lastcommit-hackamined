<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('gst_masters', function (Blueprint $table) {
            $table->id();
            $table->string('hsnCode');
            $table->string('description')->nullable();
            $table->decimal('igstPercent', 5, 2)->default(0);
            $table->decimal('cgstPercent', 5, 2)->default(0);
            $table->decimal('sgstPercent', 5, 2)->default(0);
            $table->boolean('isActive')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gst_masters');
    }
};
