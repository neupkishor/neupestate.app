import { ActivityIndicator, Alert, Animated, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Text } from '@neup/components/ui/text';
import { Button } from '@neup/components/ui/button';
import { useUserInfo } from '@neup/auth/auth';
import { getFirstName } from '@neup/auth/user-info';
import { AppPressable as TouchableOpacity } from '@/components/element/touch-feedback';

const soundParticles = [
  { direction: -1, offset: 140, top: 16, size: 7, duration: 1250, opacity: 0.46 },
  { direction: 1, offset: 144, top: 43, size: 5, duration: 1480, opacity: 0.38 },
  { direction: -1, offset: 151, top: 73, size: 6, duration: 1120, opacity: 0.42 },
  { direction: 1, offset: 138, top: 101, size: 8, duration: 1370, opacity: 0.36 },
  { direction: -1, offset: 146, top: 130, size: 5, duration: 1580, opacity: 0.44 },
];

export default function Assist() {
  const router = useRouter();
  const user = useUserInfo();
  const name = getFirstName(user) || 'there';
  const arrowOffset = useRef(new Animated.Value(0)).current;
  const circleOffset = useRef(new Animated.Value(0)).current;
  const interactionY = useRef(new Animated.Value(0)).current;
  const interactionX = useRef(new Animated.Value(0)).current;
  const interactionTilt = useRef(new Animated.Value(0)).current;
  const circleWidth = useRef(256);
  const interactionAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const micRotation = useRef(new Animated.Value(0)).current;
  const soundLevel = useRef(new Animated.Value(0)).current;
  const recordingColor = useRef(new Animated.Value(0)).current;
  const particlePhases = useRef(soundParticles.map(() => new Animated.Value(0))).current;
  const particleProgress = useRef(soundParticles.map(() => new Animated.Value(0))).current;
  const particleFade = useRef(new Animated.Value(1)).current;
  const idleParticleFade = useRef(new Animated.Value(1)).current;
  const particleModeRef = useRef<'idle' | 'recording' | 'returning'>('idle');
  const [particleMode, setParticleMode] = useState<'idle' | 'recording' | 'returning'>('idle');
  const volumeBucketRef = useRef(0);
  const [volumeBucket, setVolumeBucket] = useState(0);
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, 100);
  const recordingStartCue = useAudioPlayer(require('../../assets/audio/recording-start.wav'));
  const recordingStopCue = useAudioPlayer(require('../../assets/audio/recording-stop.wav'));
  const [recordingBusy, setRecordingBusy] = useState(false);
  const openMessage = () => router.push('/assist/message');
  const playRecordingCue = async (player: typeof recordingStartCue) => {
    try {
      await player.seekTo(0);
      player.play();
    } catch (error) {
      console.warn('[assist] unable to play recording cue', error);
    }
  };
  const playTouchMotion = () => {
    interactionAnimation.current?.stop();
    interactionY.setValue(0);
    interactionX.setValue(0);
    interactionTilt.setValue(0);
    const side = 1;
    const cycles = 2 + Math.floor(Math.random() * 3);
    const beats: Animated.CompositeAnimation[] = [];
    for (let index = 0; index < cycles; index++) {
      beats.push(Animated.parallel([
        Animated.timing(interactionY, { toValue: 5 + Math.random() * 4, duration: 100 + Math.random() * 45, useNativeDriver: true }),
        Animated.timing(interactionX, { toValue: side * (2 + Math.random() * 3), duration: 100 + Math.random() * 45, useNativeDriver: true }),
        Animated.timing(interactionTilt, { toValue: side * (1 + Math.random() * 1.5), duration: 100 + Math.random() * 45, useNativeDriver: true }),
      ]));
      beats.push(Animated.parallel([
        Animated.timing(interactionY, { toValue: -2 - Math.random() * 3, duration: 105 + Math.random() * 45, useNativeDriver: true }),
        Animated.timing(interactionX, { toValue: -side * Math.random() * 2, duration: 105 + Math.random() * 45, useNativeDriver: true }),
        Animated.timing(interactionTilt, { toValue: -side * Math.random(), duration: 105 + Math.random() * 45, useNativeDriver: true }),
      ]));
    }
    beats.push(Animated.parallel([
      Animated.timing(interactionY, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(interactionX, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(interactionTilt, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]));
    interactionAnimation.current = Animated.sequence(beats);
    interactionAnimation.current.start(({ finished }) => {
      if (finished) {
        interactionY.setValue(0);
        interactionX.setValue(0);
        interactionTilt.setValue(0);
        interactionAnimation.current = null;
      }
    });
  };
  const swipeHandlers = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy < -8,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -45 || gesture.vy < -0.5) openMessage();
    },
  })).current;

  useEffect(() => {
    const wobble = Animated.loop(Animated.sequence([
      Animated.timing(arrowOffset, { toValue: -7, duration: 420, useNativeDriver: true }),
      Animated.timing(arrowOffset, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]));
    wobble.start();
    return () => wobble.stop();
  }, [arrowOffset]);

  useEffect(() => {
    const circleWobble = Animated.loop(Animated.sequence([
      Animated.timing(circleOffset, { toValue: -4, duration: 700, useNativeDriver: true }),
      Animated.timing(circleOffset, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]));
    const micWobble = Animated.loop(Animated.sequence([
      Animated.timing(micRotation, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(micRotation, { toValue: -1, duration: 650, useNativeDriver: true }),
    ]));
    circleWobble.start();
    micWobble.start();
    return () => { circleWobble.stop(); micWobble.stop(); };
  }, [circleOffset, micRotation]);

  useEffect(() => {
    const meter = recorderState.isRecording && typeof recorderState.metering === 'number'
      ? Math.max(0, Math.min(1, (recorderState.metering + 55) / 45))
      : 0;
    const response = Animated.timing(soundLevel, { toValue: meter, duration: 130, useNativeDriver: true });
    response.start();
    return () => response.stop();
  }, [recorderState.isRecording, recorderState.metering, soundLevel]);

  useEffect(() => {
    const meter = recorderState.isRecording && typeof recorderState.metering === 'number'
      ? Math.max(0, Math.min(1, (recorderState.metering + 55) / 45))
      : 0;
    const current = volumeBucketRef.current;
    let next = current;
    if (meter > (current + 1) / 3 + 0.08) next = Math.min(2, current + 1);
    else if (meter < current / 3 - 0.08) next = Math.max(0, current - 1);
    if (next !== current) {
      volumeBucketRef.current = next;
      setVolumeBucket(next);
    }
  }, [recorderState.isRecording, recorderState.metering]);

  useEffect(() => {
    const idleLoops = particlePhases.map((phase, index) => Animated.loop(Animated.sequence([
      Animated.timing(phase, { toValue: 1, duration: soundParticles[index].duration / 2, useNativeDriver: true }),
      Animated.timing(phase, { toValue: 0, duration: soundParticles[index].duration / 2, useNativeDriver: true }),
    ])));
    idleLoops.forEach((loop) => loop.start());
    return () => idleLoops.forEach((loop) => loop.stop());
  }, [particlePhases]);

  useEffect(() => {
    if (recorderState.isRecording) {
      particleModeRef.current = 'recording';
      setParticleMode('recording');
      particleFade.stopAnimation();
      particleFade.setValue(1);
      idleParticleFade.stopAnimation();
      idleParticleFade.setValue(0);
      return;
    }

    if (particleModeRef.current !== 'recording') return;
    particleModeRef.current = 'returning';
    setParticleMode('returning');
    const returnToCenter = Animated.parallel([
      ...particleProgress.map((progress) => Animated.timing(progress, { toValue: 0, duration: 520, useNativeDriver: true })),
      Animated.timing(particleFade, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]);
    returnToCenter.start(({ finished }) => {
      if (!finished) return;
      particleModeRef.current = 'idle';
      setParticleMode('idle');
      Animated.timing(idleParticleFade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    });
    return () => returnToCenter.stop();
  }, [idleParticleFade, particleFade, particleProgress, recorderState.isRecording]);

  useEffect(() => {
    if (!recorderState.isRecording || particleMode !== 'recording') return;
    const duration = [900, 620, 390][volumeBucket];
    const travelLoops = particleProgress.map((progress, index) => Animated.loop(Animated.sequence([
      Animated.delay(index * 90),
      Animated.timing(progress, { toValue: 1, duration, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 1, useNativeDriver: true }),
    ])));
    travelLoops.forEach((loop) => loop.start());
    return () => travelLoops.forEach((loop) => loop.stop());
  }, [particleMode, particleProgress, recorderState.isRecording, volumeBucket]);

  useEffect(() => {
    const transition = Animated.timing(recordingColor, {
      toValue: recorderState.isRecording ? 1 : 0,
      duration: 1000,
      useNativeDriver: false,
    });
    transition.start();
    return () => transition.stop();
  }, [recorderState.isRecording, recordingColor]);

  const toggleRecording = async () => {
    if (recordingBusy) return;
    setRecordingBusy(true);
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
        void playRecordingCue(recordingStopCue);
        return;
      }
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone access needed', 'Allow microphone access to record a voice message for Nia.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      void playRecordingCue(recordingStartCue);
    } catch (error) {
      console.error('[assist] audio recording failed', error);
      Alert.alert('Unable to record', 'Please try recording again.');
    } finally {
      setRecordingBusy(false);
    }
  };

  const micTilt = micRotation.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });
  const outerScale = soundLevel.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const innerScale = soundLevel.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const micScale = soundLevel.interpolate({ inputRange: [0, 1], outputRange: [1, 1.32] });
  const outerColor = recordingColor.interpolate({ inputRange: [0, 1], outputRange: ['#e5e8e6', '#e1ebe3'] });
  const innerColor = recordingColor.interpolate({ inputRange: [0, 1], outputRange: ['#ffffff', '#f0f6f1'] });
  const micColor = recordingColor.interpolate({ inputRange: [0, 1], outputRange: ['#42604b', '#719064'] });
  const audioShake = Animated.multiply(soundLevel, micRotation);
  const circleShake = Animated.multiply(audioShake, 2.5);
  const micShake = Animated.multiply(audioShake, 5);

  return (
    <View style={s.page}>
      <StatusBar style="dark" />
      <View style={s.header}><Text name="appTitle">Nia</Text></View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text name="title">How can I assist you, {name}?</Text>
        <Text name="regular" style={s.intro}>I am your Nia, your personal assistant, ready to help you on the go!</Text>
        <View style={s.talkArea}>
          <View pointerEvents="none" style={s.particleLayer}>
            {soundParticles.map((particle, index) => {
              const phase = particlePhases[index];
              const progress = particleProgress[index];
              const idleX = phase.interpolate({ inputRange: [0, 1], outputRange: [particle.direction * (particle.offset - 8), particle.direction * (particle.offset + 8)] });
              const travelX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.direction * 190] });
              const audioOpacity = soundLevel.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.5] });
              const idleOpacity = idleParticleFade.interpolate({ inputRange: [0, 1], outputRange: [0, particle.opacity] });
              const opacity = particleMode === 'recording' ? audioOpacity : particleMode === 'returning' ? particleFade.interpolate({ inputRange: [0, 1], outputRange: [0, particle.opacity] }) : idleOpacity;
              const translateX = particleMode === 'idle' ? idleX : travelX;
              return <Animated.View key={`sound-particle-${index}`} style={[s.particle, { width: particle.size, height: particle.size, top: particle.top, opacity, transform: [{ translateX }] }]} />;
            })}
          </View>
          <Pressable style={s.circlePressable} onPressIn={playTouchMotion} onHoverIn={playTouchMotion} onPress={() => void toggleRecording()} accessibilityRole="button" accessibilityLabel={recorderState.isRecording ? 'Stop voice recording' : 'Start voice recording'} disabled={recordingBusy}>
            <Animated.View style={[s.outerMotion, { transform: [{ translateY: Animated.add(circleOffset, interactionY) }, { translateX: Animated.add(circleShake, interactionX) }, { rotate: interactionTilt.interpolate({ inputRange: [-4, 4], outputRange: ['-4deg', '4deg'] }) }, { scale: outerScale }] }]}>
              <Animated.View style={[s.outerCircle, { backgroundColor: outerColor }]}>
                <Animated.View style={[s.innerMotion, { transform: [{ translateY: Animated.multiply(circleOffset, -0.55) }, { scale: innerScale }] }]}>
                  <Animated.View style={[s.innerCircle, { backgroundColor: innerColor }]}>
                    <Animated.View style={[s.micMotion, { transform: [{ rotate: micTilt }, { translateX: micShake }, { scale: micScale }] }]}>
                      <View style={s.micIcon}>
                        {recordingBusy ? <ActivityIndicator color="#42604b" /> : <><Animated.View style={[s.micStem, { backgroundColor: micColor }]} /><Animated.View style={[s.micBase, { borderColor: micColor }]} /></>}
                      </View>
                    </Animated.View>
                  </Animated.View>
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </Pressable>
          {recorderState.isRecording && <Text name="caption" style={s.recordingStatus}>Recording · tap the mic to stop</Text>}
        </View>
      </ScrollView>
      <View style={s.messageHint} {...swipeHandlers.panHandlers}>
        <Button variant="plain" style={s.messageHintButton} onPress={openMessage}>
          <Animated.View style={[s.arrows, { transform: [{ translateY: arrowOffset }] }]}>
            <Text name="title3" style={s.arrow}>⌃</Text>
            <Text name="title3" style={s.arrowSecond}>⌃</Text>
          </Animated.View>
          <Text name="regular" style={s.hintText}>Write a message to Nia</Text>
        </Button>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f6f7f9' },
  header: { height: 88, paddingTop: 38, paddingHorizontal: 20, backgroundColor: '#fff', justifyContent: 'center', elevation: 8, shadowColor: '#173d35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, zIndex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 24, overflow: 'visible' },
  intro: { color: '#70817c', marginTop: 8 },
  talkArea: { alignItems: 'center', marginTop: 20, paddingVertical: 28, overflow: 'visible' },
  particleLayer: { position: 'absolute', width: 360, height: 160, left: '50%', marginLeft: -180, top: 104, overflow: 'visible', zIndex: 0 },
  particle: { position: 'absolute', left: 177, borderRadius: 99, backgroundColor: '#71877d' },
  circlePressable: { alignSelf: 'center', overflow: 'visible' },
  outerMotion: { alignItems: 'center', justifyContent: 'center' },
  outerCircle: { width: 256, height: 256, padding: 16, borderRadius: 128, alignItems: 'center', justifyContent: 'center', shadowColor: '#173d35', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16, shadowRadius: 18, elevation: 10 },
  innerMotion: { alignItems: 'center', justifyContent: 'center' },
  innerCircle: { width: 158, height: 158, borderRadius: 79, alignItems: 'center', justifyContent: 'center', shadowColor: '#173d35', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  micMotion: { alignItems: 'center', justifyContent: 'center' },
  micIcon: { width: 42, height: 52, alignItems: 'center', justifyContent: 'flex-start' },
  micStem: { width: 18, height: 30, borderRadius: 10, backgroundColor: '#42604b' },
  micBase: { width: 32, height: 15, marginTop: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderRightWidth: 3, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  recordingStatus: { color: '#42604b', marginTop: 16 },
  messageHint: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  messageHintButton: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  arrows: { alignItems: 'center', height: 28 },
  arrow: { color: '#42604b', fontSize: 21, lineHeight: 17 },
  arrowSecond: { color: '#658b4f', fontSize: 21, lineHeight: 17, marginTop: -4 },
  hintText: { color: '#9aa6a2', marginTop: 1 },
});
