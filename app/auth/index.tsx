import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from '#/components/ui/text';
import { useAuthSession } from '@/app/auth/AuthSessionProvider';
import { runApi } from '#/core/infrastructure/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getErrorMessage } from '#/core/error-messages';

type AuthRequest = { id: string; actBefore: string; expiresOn: string; jwt: string };
type ContinueStep = 'password' | 'mfaToken' | 'totpToken' | 'termsApproval' | 'chooseOtpMethod' | 'verifyOtpMethod' | 'saveToken' | 'tokenSave' | 'saveTotp';
type SignInResponse = { success?: boolean; token?: string; auth_account?: string; continue?: ContinueStep; jwt?: string; nextStep?: string; message?: string; error?: string; displayName?: string };
type FlowStep = 'auth' | 'auth.signin.neupid' | 'auth.signin.password' | 'auth.signin.mfa' | 'auth.signin.mfa.identityVerification' | 'auth.signin.mfa.verification' | 'auth.signin.terms' | 'auth.signin.saveToken' | 'auth.signup' | 'auth.signup.name' | 'auth.signup.demographics' | 'auth.signup.neupid' | 'auth.signup.contact' | 'auth.signup.contactOtpVerification' | 'auth.signup.password' | 'auth.signup.terms' | 'auth.signup.saveToken';

export default function SignIn() {
  const router = useRouter();
  const { setToken, authenticated, expired, loading: authLoading } = useAuthSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [steps, setSteps] = useState<FlowStep[]>(['auth', 'auth.signin.neupid']);
  const [neupId, setNeupId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [invalidPasswordAttempt, setInvalidPasswordAttempt] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [response, setResponse] = useState<SignInResponse | null>(null);
  const [authRequest, setAuthRequest] = useState<AuthRequest | null>(null);
  const [requestLoading, setRequestLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [neupIdLoading, setNeupIdLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingDots, setLoadingDots] = useState('.');

  useEffect(() => {
    if (!authLoading && authenticated) router.replace('/(tabs)/home');
  }, [authLoading, authenticated, router]);

  const [continueStep, setContinueStep] = useState<ContinueStep | null>(null);
  const [otpMethod, setOtpMethod] = useState('');
  const [otpDestination, setOtpDestination] = useState('');
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (!requestLoading && !loading && !neupIdLoading) {
      setLoadingDots('.');
      return;
    }
    const sequence = ['.', '..', '...', '..'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % sequence.length;
      setLoadingDots(sequence[index]);
    }, 350);
    return () => clearInterval(interval);
  }, [requestLoading, loading, neupIdLoading]);

  useEffect(() => {
    console.log('[auth] GET /account/bridge/api.v1/auth/signin');
    void runApi<AuthRequest>({ baseUrl: 'https://neupgroup.com/account', path: '/bridge/api.v1/auth/signin' })
      .then((result) => {
        console.log('[auth] GET /account/bridge/api.v1/auth/signin response', { status: result.status, ok: result.ok, body: result.body });
        if (!result.ok || !result.body?.jwt) {
          setError('There seems to be some error on our side, Please try again later.');
          return;
        }
        setAuthRequest(result.body);
      })
      .catch((requestError) => {
        console.error('[auth] GET /account/bridge/api.v1/auth/signin failed', requestError);
        setError('There seems to be some error on our side, Please try again later.');
      })
      .finally(() => setRequestLoading(false));
  }, []);

  const continueToPassword = async () => {
    if (!neupId.trim()) return setError('Enter your NeupID to continue.');
    if (!authRequest) return setError('Sign-in is not ready yet. Please try again.');
    setError('');
    setNeupIdLoading(true);
    try {
      console.log('[auth] POST /account/bridge/api.v1/auth/signin request', { url: 'https://neupgroup.com/account/bridge/api.v1/auth/signin', method: 'POST', headers: { Authorization: 'Bearer ' + authRequest.jwt, 'Content-Type': 'application/json' }, body: { neupid: neupId.trim() } });
      const result = await runApi<SignInResponse>({ baseUrl: 'https://neupgroup.com/account', path: '/bridge/api.v1/auth/signin', method: 'POST', bearerToken: authRequest.jwt, body: { neupid: neupId.trim() } });
      console.log('[auth] POST /account/bridge/api.v1/auth/signin response', { status: result.status, ok: result.ok, body: result.body });
      if (!result.ok || result.body?.success === false || result.body?.error) {
        setError(getErrorMessage(result.body?.error, 'auth.signin.neupid.invalid'));
        return;
      }
      if (result.body?.continue !== 'password') {
        setError(getErrorMessage('auth.signin.request.invalid', 'Please start again.'));
        return;
      }
      if (result.body?.jwt) setAuthRequest({ ...authRequest, jwt: result.body.jwt });
      if (result.body?.displayName) setDisplayName(result.body.displayName);
      setSteps((current) => [...current, 'auth.signin.password']);
      setStep(2);
    } catch (requestError) {
      console.error('[auth] POST /account/bridge/api.v1/auth/signin failed', requestError);
      setError('There seems to be some error on our side, Please try again later.');
    } finally {
      setNeupIdLoading(false);
    }
  };

  const signIn = async () => {
    if (!password) return setError('Enter your password to continue.');
    if (!authRequest) return setError('Sign-in is not ready yet. Please try again.');
    setError('');
    setLoading(true);
    try {
      console.log('[auth] POST /account/bridge/api.v1/auth/signin request', { url: 'https://neupgroup.com/account/bridge/api.v1/auth/signin', method: 'POST', headers: { Authorization: 'Bearer ' + authRequest.jwt, 'Content-Type': 'application/json' }, body: { password } });
      const result = await runApi<SignInResponse>({
        baseUrl: 'https://neupgroup.com/account',
        path: '/bridge/api.v1/auth/signin',
        method: 'POST',
        bearerToken: authRequest.jwt,
        body: { password },
      });
      console.log('[auth] POST /account/bridge/api.v1/auth/signin response', { status: result.status, ok: result.ok, body: result.body });
      setResponse(result.body);
      if (result.body?.jwt) setAuthRequest({ ...authRequest, jwt: result.body.jwt });
      if (!result.ok || result.body?.success === false || result.body?.error) {
        if (result.body?.error === 'auth.signin.password.invalid') setInvalidPasswordAttempt(password);
        setError(result.body?.error === 'auth.signin.password.empty'
          ? 'Enter your password to continue.'
          : result.body?.error === 'auth.signin.password.invalid'
            ? 'The password you entered is incorrect.'
            : getErrorMessage(result.body?.error, 'The password is incorrect.'));
        setStep(2);
        return;
      }
      if (result.body?.continue === 'saveToken' || result.body?.continue === 'tokenSave' || result.body?.continue === 'saveTotp') {
        if (!result.body.token) {
          setError('There seems to be some error on our side, Please try again later.');
          return;
        }
        await setToken(result.body.token);
        setSteps(['auth']);
        router.replace('/(tabs)/home');
        return;
      }
      setContinueStep(result.body?.continue ?? null);
      const token = result.body?.token ?? result.body?.auth_account;
      if (token) {
        await setToken(token);
        router.replace('/(tabs)/home');
        return;
      }
      const nextStep: FlowStep = result.body?.continue === 'termsApproval'
        ? 'auth.signin.terms'
        : result.body?.continue === 'mfaToken' || result.body?.continue === 'totpToken'
          ? 'auth.signin.mfa'
          : 'auth.signin.saveToken';
      setSteps((current) => [...current, nextStep]);
      setStep(3);
    } catch (requestError) {
      console.error('[auth] POST /account/bridge/api.v1/auth/signin failed', requestError);
      setResponse({ error: 'auth.signin.request.failed' });
      setError('There seems to be some error on our side, Please try again later.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const submitChallenge = async () => {
    if (!authRequest || !continueStep) return;
    const body =
      continueStep === 'chooseOtpMethod' ? { otpMethod } :
      continueStep === 'verifyOtpMethod' ? { otpMethod, otpDestination, otpCode } :
      continueStep === 'termsApproval' ? { approve: true } :
      continueStep === 'mfaToken' ? { mfaToken: otpCode } :
      { totpToken: otpCode };
    setLoading(true);
    try {
      const result = await runApi<SignInResponse>({ baseUrl: 'https://neupgroup.com/account', path: '/bridge/api.v1/auth/signin', method: 'POST', bearerToken: authRequest.jwt, body });
      console.log('[auth] challenge response', { status: result.status, ok: result.ok, body: result.body });
      if (!result.ok || result.body?.success === false || result.body?.error) {
        setError('There seems to be some error on our side, Please try again later.');
        return;
      }
      setResponse(result.body);
      if (result.body?.jwt) setAuthRequest({ ...authRequest, jwt: result.body.jwt });
      if (result.body?.continue === 'saveToken' || result.body?.continue === 'tokenSave' || result.body?.continue === 'saveTotp') {
        console.log('[auth] token-save step received', { continue: result.body.continue, hasToken: Boolean(result.body.token) });
        if (!result.body.token) {
          setError('There seems to be some error on our side, Please try again later.');
          return;
        }
        console.log('[auth] saving token to secure storage', { token: '[redacted]' });
        await setToken(result.body.token);
        console.log('[auth] token saved to secure storage');
        setSteps(['auth']);
        console.log('[auth] auth step history cleared');
        router.replace('/(tabs)/home');
        console.log('[auth] redirected to homepage');
        return;
      }
      setContinueStep(result.body?.continue ?? null);
    } catch (requestError) {
      console.error('[auth] challenge failed', requestError);
      setError('There seems to be some error on our side, Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (steps.length <= 1) return router.back();
    setSteps((current) => current.slice(0, -1));
    const previous = steps[steps.length - 2];
    setStep(previous === 'auth.signin.password' ? 2 : 1);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (steps.length <= 1) return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [steps]);

  if (expired) return <SafeAreaView style={s.page}><StatusBar style="dark" /><View style={s.expired}><Text name="pageTitle" style={s.title}>You've been Signed Out.</Text><TouchableOpacity style={s.primary} onPress={() => { void setToken(null); setSteps(['auth', 'auth.signin.neupid']); setStep(1); }}><Text name="propertyTourButton">Sign in again</Text></TouchableOpacity><TouchableOpacity style={s.secondary} onPress={() => router.push('/auth/signup')}><Text name="propertyButton">Create a new Account</Text></TouchableOpacity></View></SafeAreaView>;

  return <SafeAreaView style={s.page}><StatusBar style="dark" /><KeyboardAvoidingView style={s.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><TouchableOpacity onPress={goBack}><Text name="propertyNavIcon" style={s.back}>‹</Text></TouchableOpacity><View style={s.body}><Text name="homeKicker">SIGN IN</Text>{step === 1 && <><Text name="pageTitle" style={s.title}>Enter your NeupID</Text><Text name="homeSubtitle" style={s.subtitle}>Use your NeupID to continue.</Text><TextInput autoFocus value={neupId} onChangeText={setNeupId} style={s.input} placeholder="NeupID" placeholderTextColor="#9aa6a2" autoCapitalize="none" /></>}{step === 2 && <><Text name="pageTitle" style={s.title}>Enter your password</Text><Text name="homeSubtitle" style={s.subtitle}>Welcome back, {neupId}.</Text><View style={s.passwordField}><TextInput autoFocus value={password} onChangeText={setPassword} style={s.passwordInput} placeholder="Password" placeholderTextColor="#9aa6a2" secureTextEntry={!showPassword} /><TouchableOpacity style={s.eyeButton} onPress={() => setShowPassword((visible) => !visible)} accessibilityLabel={showPassword ? "Hide password" : "Show password"}><Text style={s.eye}>{showPassword ? "◉" : "◌"}</Text></TouchableOpacity></View></>}{step === 3 && (continueStep === 'termsApproval' ? <><Text name="pageTitle" style={s.title}>Terms of Service</Text><Text name="homeSubtitle" style={s.termsCopy}>By continuing further, You ({displayName || neupId}) accept to the following terms of services and privacy policy:</Text></> : <><Text name="pageTitle" style={s.title}>{response?.error ? 'Sign-in needs attention' : response?.continue || response?.nextStep || 'Almost there'}</Text><Text name="homeSubtitle" style={s.subtitle}>{response?.error ? getErrorMessage(response.error, 'We could not complete sign-in. Please try again.') : response?.message || 'Your sign-in request was received.'}</Text></>)}{error ? <Text name="propertyError" style={s.error}>{error}</Text> : null}{(step < 3 || (step === 3 && continueStep === 'termsApproval')) && <TouchableOpacity disabled={loading || neupIdLoading || requestLoading || !authRequest} style={s.primary} onPress={step === 1 ? continueToPassword : step === 2 ? signIn : submitChallenge}><Text name="propertyTourButton">{step === 3 ? 'Agree' : 'Continue'}{requestLoading || loading || neupIdLoading ? ' ' + loadingDots : ''}</Text></TouchableOpacity>}</View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const s = StyleSheet.create({ page:{flex:1,backgroundColor:'#f6f7f9',padding:20},keyboard:{flex:1},content:{flexGrow:1},back:{},body:{marginTop:58},expired:{flex:1,justifyContent:'center'},title:{marginTop:10},subtitle:{marginTop:8,marginBottom:28},termsCopy:{marginTop:8,lineHeight:22},input:{height:54,backgroundColor:'#fff',borderRadius:14,paddingHorizontal:16,color:'#173d35',fontFamily:'outfit.regular.ttf',fontSize:14,marginBottom:12},passwordField:{height:54,backgroundColor:'#fff',borderRadius:14,flexDirection:'row',alignItems:'center',paddingRight:10,marginBottom:12},passwordInput:{flex:1,height:54,paddingHorizontal:16,color:'#173d35',fontFamily:'outfit.regular.ttf',fontSize:14},eyeButton:{width:42,height:54,alignItems:'center',justifyContent:'center'},eye:{fontSize:20},primary:{backgroundColor:'#173d35',borderRadius:14,paddingVertical:16,alignItems:'center',marginTop:10},secondary:{borderWidth:1,borderColor:'#173d35',borderRadius:14,paddingVertical:15,alignItems:'center',marginTop:12},error:{marginTop:4}});
