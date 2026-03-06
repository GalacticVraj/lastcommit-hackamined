<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AI\AISummaryService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GenerateAlertNotifications extends Command
{
    protected $signature = 'ai:generate-alerts';
    protected $description = 'Generate AI alerts and notification flags for users';

    public function handle(AISummaryService $aiService)
    {
        $this->info('Generating alerts...');

        try {
            $users = DB::table('users')->where('status', 'Active')->get();
            if ($users->isEmpty()) {
                $users = DB::table('users')->get();
            }
        } catch(\Exception $e) {
            $this->error('Users table not found');
            return;
        }

        $insightsData = $aiService->collectInsights();

        $allAlerts = array_merge(
            array_map(function($a) { $a['severity'] = 'critical'; return $a; }, $insightsData['critical']),
            array_map(function($a) { $a['severity'] = 'warning'; return $a; }, $insightsData['warning'])
        );

        foreach ($users as $user) {
            foreach ($allAlerts as $alert) {
                try {
                    $exists = DB::table('notification_flags')
                        ->where('user_id', $user->id)
                        ->where('alert_type', $alert['type'])
                        ->where('reference_id', $alert['reference_id'])
                        ->where('reference_table', $alert['reference_table'])
                        ->where('is_seen', false)
                        ->exists();

                    if (!$exists) {
                        DB::table('notification_flags')->insert([
                            'user_id' => $user->id,
                            'alert_type' => $alert['type'],
                            'reference_id' => $alert['reference_id'],
                            'reference_table' => $alert['reference_table'],
                            'severity' => $alert['severity'],
                            'message' => $alert['message'],
                            'is_seen' => false,
                            'created_at' => Carbon::now(),
                            'updated_at' => Carbon::now()
                        ]);
                    }
                } catch (\Exception $e) {
                    // silently fail if table doesn't exist yet
                }
            }
        }

        $this->info('Alerts generated.');
    }
}
