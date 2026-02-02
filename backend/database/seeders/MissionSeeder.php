<?php

namespace Database\Seeders;

use App\Models\Mission;
use Illuminate\Database\Seeder;

class MissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $missions = [
            [
                'title' => 'Swarm Protocol - Initiation',
                'difficulty' => 'Easy',
                'rewards' => '3%',
                'mission_points' => '10 - 60 - 100',
                'participants_limit' => 1000,
                'current_participants' => 0,
                'start_in' => '30 days',
                'description' => 'Entry-level swarm coordination mission. Learn the basics of drone network operations.',
                'objectives' => [
                    'Complete basic drone calibration',
                    'Participate in swarm formation',
                    'Maintain uplink for 24 hours',
                ],
                'requirements' => 'Minimum Observer tier required',
                'status' => 'upcoming',
                'sort_order' => 1,
                'is_visible' => true,
            ],
            [
                'title' => 'Swarm Protocol - Flood',
                'difficulty' => 'Easy',
                'rewards' => '3%',
                'mission_points' => '10 - 60 - 100',
                'participants_limit' => 1000,
                'current_participants' => 0,
                'start_in' => '51 days',
                'description' => 'Coordinated flood surveillance mission with multiple drone units.',
                'objectives' => [
                    'Deploy drone to designated zone',
                    'Maintain formation with other units',
                    'Complete surveillance sweep',
                ],
                'requirements' => 'Minimum Observer tier required',
                'status' => 'upcoming',
                'sort_order' => 2,
                'is_visible' => true,
            ],
            [
                'title' => 'Swarm Protocol - Operational',
                'difficulty' => 'Medium',
                'rewards' => '0%',
                'mission_points' => '50',
                'participants_limit' => 500,
                'current_participants' => 0,
                'start_in' => '62 days',
                'description' => 'Advanced operational mission requiring coordination skills.',
                'objectives' => [
                    'Lead drone formation',
                    'Complete tactical objectives',
                    'Report findings to command',
                ],
                'requirements' => 'Minimum Operator tier required',
                'status' => 'upcoming',
                'sort_order' => 3,
                'is_visible' => true,
            ],
            [
                'title' => 'Operation Infrastructure',
                'difficulty' => 'Medium',
                'rewards' => '0%',
                'mission_points' => '50',
                'participants_limit' => 200,
                'current_participants' => 0,
                'start_in' => '75 days',
                'description' => 'Critical infrastructure surveillance and mapping mission.',
                'objectives' => [
                    'Map designated infrastructure',
                    'Document anomalies',
                    'Secure perimeter data',
                ],
                'requirements' => 'Minimum Operator tier required',
                'status' => 'upcoming',
                'sort_order' => 4,
                'is_visible' => true,
            ],
        ];

        foreach ($missions as $missionData) {
            Mission::updateOrCreate(
                ['title' => $missionData['title']],
                $missionData
            );
        }
    }
}
