import { all, takeLatest, call, put } from 'redux-saga/effects';
import { toast } from 'react-toastify';

import api from '~/services/api';

import { updateProfileSuccess, updateProfileFailure } from './actions';
import { USER_UPDATE_PROFILE_REQUEST } from '~/utils/constants';

export function* updateProfile({ payload }) {
  try {
    const { name, email, avatar_id, ...rest } = payload.data;

    const profile = {
      name,
      email,
      avatar_id,
      ...(rest.oldPassword ? rest : {}),
    };

    const resp = yield call(api.put, 'users', profile);

    toast.success('Perfil atualizado com sucesso!');

    yield put(updateProfileSuccess(resp.data));
  } catch (err) {
    toast.error('Erro ao atualizar o perfil, confira seus dados!');
    yield put(updateProfileFailure());
  }
}

export default all([takeLatest(USER_UPDATE_PROFILE_REQUEST, updateProfile)]);
