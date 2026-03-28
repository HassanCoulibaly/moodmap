// ─── Shared constants used across multiple components ─────────────────────────

export const MOODS = [
  { label: 'Happy',    emoji: '😊', color: '#4CAF50' },
  { label: 'Excited',  emoji: '🤩', color: '#FF9800' },
  { label: 'Anxious',  emoji: '😰', color: '#9C27B0' },
  { label: 'Stressed', emoji: '😤', color: '#F44336' },
  { label: 'Sad',      emoji: '😔', color: '#2196F3' },
]

export const POSITIVE_MOODS = ['Happy', 'Excited']

export const MOOD_SCORE = { Happy: 5, Excited: 4, Sad: 2, Anxious: 2, Stressed: 1 }

export const GSU_CENTER = [33.7490, -84.3880]

export const SEED_PINS = [
  {id:1,  lat:33.7502, lng:-84.3871, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:02 AM'},
  {id:2,  lat:33.7498, lng:-84.3878, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:05 AM'},
  {id:3,  lat:33.7501, lng:-84.3865, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'9:08 AM'},
  {id:4,  lat:33.7489, lng:-84.3882, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'9:10 AM'},
  {id:5,  lat:33.7485, lng:-84.3890, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'9:12 AM'},
  {id:6,  lat:33.7493, lng:-84.3876, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:15 AM'},
  {id:7,  lat:33.7478, lng:-84.3885, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'9:18 AM'},
  {id:8,  lat:33.7506, lng:-84.3868, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'9:20 AM'},
  {id:9,  lat:33.7511, lng:-84.3874, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'9:22 AM'},
  {id:10, lat:33.7487, lng:-84.3891, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'9:25 AM'},
  {id:11, lat:33.7496, lng:-84.3863, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:28 AM'},
  {id:12, lat:33.7503, lng:-84.3880, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'9:30 AM'},
  {id:13, lat:33.7481, lng:-84.3872, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'9:33 AM'},
  {id:14, lat:33.7509, lng:-84.3861, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:35 AM'},
  {id:15, lat:33.7474, lng:-84.3888, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'9:38 AM'},
  {id:16, lat:33.7518, lng:-84.3877, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'9:40 AM'},
  {id:17, lat:33.7490, lng:-84.3856, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'9:42 AM'},
  {id:18, lat:33.7483, lng:-84.3895, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:45 AM'},
  {id:19, lat:33.7507, lng:-84.3883, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'9:48 AM'},
  {id:20, lat:33.7476, lng:-84.3869, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'9:50 AM'},
  {id:21, lat:33.7499, lng:-84.3858, mood:'Stressed', color:'#F44336', emoji:'😤', time:'9:52 AM'},
  {id:22, lat:33.7486, lng:-84.3875, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'9:55 AM'},
  {id:23, lat:33.7513, lng:-84.3890, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'9:58 AM'},
  {id:24, lat:33.7470, lng:-84.3880, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'10:02 AM'},
  {id:25, lat:33.7494, lng:-84.3870, mood:'Stressed', color:'#F44336', emoji:'😤', time:'10:05 AM'},
  {id:26, lat:33.7505, lng:-84.3862, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'10:08 AM'},
  {id:27, lat:33.7480, lng:-84.3893, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'10:10 AM'},
  {id:28, lat:33.7516, lng:-84.3871, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'10:12 AM'},
  {id:29, lat:33.7491, lng:-84.3887, mood:'Stressed', color:'#F44336', emoji:'😤', time:'10:15 AM'},
  {id:30, lat:33.7473, lng:-84.3864, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'10:18 AM'},
  {id:31, lat:33.7508, lng:-84.3876, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'10:20 AM'},
  {id:32, lat:33.7484, lng:-84.3859, mood:'Stressed', color:'#F44336', emoji:'😤', time:'10:22 AM'},
  {id:33, lat:33.7497, lng:-84.3892, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'10:25 AM'},
  {id:34, lat:33.7512, lng:-84.3866, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'10:28 AM'},
  {id:35, lat:33.7477, lng:-84.3878, mood:'Stressed', color:'#F44336', emoji:'😤', time:'10:30 AM'},
  {id:36, lat:33.7502, lng:-84.3855, mood:'Anxious',  color:'#9C27B0', emoji:'😰', time:'10:32 AM'},
  {id:37, lat:33.7469, lng:-84.3885, mood:'Excited',  color:'#FF9800', emoji:'🤩', time:'10:35 AM'},
  {id:38, lat:33.7520, lng:-84.3882, mood:'Stressed', color:'#F44336', emoji:'😤', time:'10:38 AM'},
  {id:39, lat:33.7488, lng:-84.3867, mood:'Happy',    color:'#4CAF50', emoji:'😊', time:'10:40 AM'},
  {id:40, lat:33.7495, lng:-84.3896, mood:'Sad',      color:'#2196F3', emoji:'😔', time:'10:42 AM'},
]

export const WAVE_PINS = [
  { lat: 33.7515, lng: -84.3872 },
  { lat: 33.7512, lng: -84.3861 },
  { lat: 33.7508, lng: -84.3880 },
  { lat: 33.7497, lng: -84.3875 },
  { lat: 33.7493, lng: -84.3862 },
  { lat: 33.7489, lng: -84.3888 },
  { lat: 33.7484, lng: -84.3870 },
  { lat: 33.7479, lng: -84.3879 },
  { lat: 33.7473, lng: -84.3864 },
  { lat: 33.7468, lng: -84.3883 },
]

export const SECRET_STRESS_PINS = [
  { lat: 33.7511, lng: -84.3869 },
  { lat: 33.7514, lng: -84.3876 },
  { lat: 33.7508, lng: -84.3863 },
  { lat: 33.7516, lng: -84.3871 },
  { lat: 33.7505, lng: -84.3878 },
  { lat: 33.7519, lng: -84.3865 },
  { lat: 33.7502, lng: -84.3874 },
  { lat: 33.7513, lng: -84.3882 },
]

export const KNOWN_AREAS = ['GSU Library', 'Student Center', 'Classroom South', 'Five Points']

export const ALERT_CONFIG = {
  Anxious: {
    color: '#9C27B0', bg: '#f3e5f5', border: '#ce93d8',
    label: 'ANXIETY CLUSTER ALERT',
    message: loc =>
      `Anxiety cluster detected near ${loc}. Recommended: Deploy a peer support ambassador to this area. Consider sending a campus-wide breathing exercise notification.`,
    buttonLabel: '🌬️ Send Campus Wellness Tip',
    notification: 'Deep breath: Inhale 4 counts, hold 4, exhale 4. You\'ve got this. — GSU Wellness Team',
  },
  Stressed: {
    color: '#F44336', bg: '#ffebee', border: '#ef9a9a',
    label: 'HIGH STRESS ZONE ALERT',
    message: loc =>
      `High stress zone near ${loc}. Peak stress detected — possibly exam or deadline related. Recommended: Open the quiet study room, extend library hours, send a motivational message.`,
    buttonLabel: '💪 Send Encouragement',
    notification: 'You\'re closer than you think. Keep going. — GSU Cares Team',
  },
  Sad: {
    color: '#2196F3', bg: '#e3f2fd', border: '#90caf9',
    label: 'LOW MOOD CLUSTER ALERT',
    message: loc =>
      `Low mood cluster detected near ${loc}. Students may need connection. Recommended: Activate the buddy system — pair lonely students with peer mentors.`,
    buttonLabel: '🤝 Activate Buddy System',
    notification: 'Hey, you matter. A peer mentor will check in with you today. — GSU Connects',
  },
  Happy: {
    color: '#4CAF50', bg: '#e8f5e9', border: '#a5d6a7',
    label: 'POSITIVE ENERGY DETECTED',
    message: loc =>
      `Positive energy radiating from ${loc}! Great time to host a spontaneous community event or social activity here.`,
    buttonLabel: '🎉 Share the Joy',
    notification: 'Good vibes detected near the Student Center — come join the energy! — GSU Community',
  },
  Excited: {
    color: '#FF9800', bg: '#fff3e0', border: '#ffcc80',
    label: 'HIGH ENERGY DETECTED',
    message: loc =>
      `Positive energy radiating from ${loc}! Great time to host a spontaneous community event or social activity here.`,
    buttonLabel: '🎉 Share the Joy',
    notification: 'Good vibes detected near the Student Center — come join the energy! — GSU Community',
  },
}

export const CRISIS_ACTIONS = [
  {
    icon: '🏥',
    label: 'Open emergency counseling walk-ins',
    confirm: 'Walk-in center notified — opening immediately',
  },
  {
    icon: '📢',
    label: 'Send campus-wide wellness notification',
    confirm: 'Notification queued for 2,847 student devices',
  },
  {
    icon: '🤝',
    label: 'Deploy peer support team to hotspot zones',
    confirm: 'Team dispatched — ETA 4 minutes',
  },
]

export const STORY_PLACEHOLDERS = [
  'I went for a walk outside...',
  'I called my mom...',
  'I listened to my favourite song...',
  'I took a 10 min break and stretched...',
  'I got a coffee and watched the world go by...',
  'I talked to a friend about it...',
]
