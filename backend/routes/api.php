<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AI\AISummaryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/v1/ai/insights', [AISummaryController::class, 'insights']);
    Route::get('/v1/ai/sales-projection', [AISummaryController::class, 'salesProjection']);
    Route::get('/v1/ai/recruitment-projection', [AISummaryController::class, 'recruitmentProjection']);
    Route::get('/v1/ai/unread-count', [AISummaryController::class, 'unreadCount']);
    Route::patch('/v1/ai/mark-seen', [AISummaryController::class, 'markSeen']);
    Route::post('/v1/ai/refresh', [AISummaryController::class, 'refreshInsights']);
});
