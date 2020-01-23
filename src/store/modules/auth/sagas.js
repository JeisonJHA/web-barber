import { takeLatest, call, put, all } from 'redux-saga/effects';
import { toast } from 'react-toastify';

import api from '~/services/api';
import { signInSuccess, signFailure } from './actions';
import history from '~/services/history';
import {
  AUTH_SIGN_UP_REQUEST,
  AUTH_SIGN_IN_REQUEST,
  AUTH_SIGN_OUT,
} from '~/utils/constants';

export function* signIn({ payload }) {
  try {
    const { email, password } = payload;

    const resp = yield call(api.post, '/session', {
      email,
      password,
    });

    const { token, user } = resp.data;

    if (!user.provider) {
      toast.error('Usuário não autorizado');
      return;
    }

    api.defaults.headers.Authorization = `Bearer ${token}`;

    yield put(signInSuccess(token, user));

    history.push('/dashboard');
  } catch (err) {
    toast.error('Falha na autenticação, verifique seus dados');
    yield put(signFailure());
  }
}

export function* signUp({ payload }) {
  try {
    const { name, email, password } = payload;
    yield call(api.post, 'users', {
      name,
      email,
      password,
      provider: true,
    });
    history.push('/');
  } catch (err) {
    toast.error('Falha no cadastro, verifique seus dados');
    yield put(signFailure());
  }
}

export function setToken({ payload }) {
  if (!payload) return;
  const { token } = payload.auth;
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
  }
}

export function signOut() {
  history.push('/');
}

export default all([
  takeLatest('persist/REHYDRATE', setToken),
  takeLatest(AUTH_SIGN_IN_REQUEST, signIn),
  takeLatest(AUTH_SIGN_UP_REQUEST, signUp),
  takeLatest(AUTH_SIGN_OUT, signOut),
]);
