<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('Barcode', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->unsignedBigInteger('productId');
            $table->string('batchNo')->nullable();
            $table->decimal('qty', 15, 2)->default(0);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Barcode');
    }
};
