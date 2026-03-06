<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Services\AI\AISummaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AISummaryController extends Controller
{
    protected $aiService;

    public function __construct(AISummaryService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function insights(Request $request)
    {
        $userId = $request->user() ? $request->user()->id : 1;
        $cacheKey = "ai_insights_{$userId}";

        $result = Cache::remember($cacheKey, 900, function () use ($userId) {
            $insightsData = $this->aiService->collectInsights();
            $aiGenerated = $this->aiService->generateAIInsights($insightsData);
            
            $logData = [
                'insights_generated' => json_encode($aiGenerated),
                'generated_at' => Carbon::now()
            ];

            try {
                DB::table('ai_summary_logs')->insert(array_merge([
                    'user_id' => $userId,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now()
                ], $logData));
            } catch (\Exception $e) {}

            return [
                'alerts' => $insightsData,
                'ai_insights' => $aiGenerated,
                'timestamp' => Carbon::now()->toIso8601String()
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    public function salesProjection(Request $request)
    {
        $userId = $request->user() ? $request->user()->id : 1;
        $cacheKey = "ai_sales_{$userId}";

        $result = Cache::remember($cacheKey, 1800, function () {
            return $this->aiService->generateSalesProjection();
        });

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    public function recruitmentProjection(Request $request)
    {
        $userId = $request->user() ? $request->user()->id : 1;
        $cacheKey = "ai_recruitment_{$userId}";

        $result = Cache::remember($cacheKey, 1800, function () {
            return $this->aiService->generateRecruitmentProjection();
        });

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    public function unreadCount(Request $request)
    {
        $userId = $request->user() ? $request->user()->id : 1;
        
        $criticalC = 0;
        $warningC = 0;
        
        try {
            $criticalC = DB::table('notification_flags')->where('user_id', $userId)->where('is_seen', false)->where('severity', 'critical')->count();
            $warningC = DB::table('notification_flags')->where('user_id', $userId)->where('is_seen', false)->where('severity', 'warning')->count();
        } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'critical_count' => $criticalC,
            'warning_count' => $warningC,
            'total_count' => $criticalC + $warningC
        ]);
    }

    public function markSeen(Request $request)
    {
        $userId = $request->user() ? $request->user()->id : 1;

        try {
            DB::table('notification_flags')
                ->where('user_id', $userId)
                ->update(['is_seen' => true, 'updated_at' => Carbon::now()]);
        } catch (\Exception $e) {}
        
        Cache::forget("ai_insights_{$userId}");

        return response()->json(['success' => true]);
    }

    public function refreshInsights(Request $request)
    {
        $userId = $request->user() ? $request->user()->id : 1;
        Cache::forget("ai_insights_{$userId}");
        Cache::forget("ai_sales_{$userId}");
        Cache::forget("ai_recruitment_{$userId}");

        return $this->insights($request);
    }

    public function summarize(Request $request)
    {
        $request->validate([
            'type' => 'required|string',
            'data' => 'required|array',
        ]);

        $summary = $this->aiService->summarizeContext($request->input('type'), $request->input('data'));

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary
            ]
        ]);
    }
}
