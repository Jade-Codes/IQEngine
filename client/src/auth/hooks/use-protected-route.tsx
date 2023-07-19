import { Navigate } from 'react-router-dom';
import React from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

export function useProtectedRoute(children) {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();

  if (!activeAccount) {
    return <Navigate to="/" />;
  }

  if (activeAccount) {
    const accessTokenRequest = {
      scopes: ['user.read'],
      account: activeAccount,
    };

    instance
      .acquireTokenSilent(accessTokenRequest)
      .then((accessTokenResponse) => {
        let accessToken = accessTokenResponse.accessToken;
        console.log(accessToken);
      })
      .catch((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          instance
            .acquireTokenPopup(accessTokenRequest)
            .then(function (accessTokenResponse) {
              let accessToken = accessTokenResponse.accessToken;
              console.log(accessToken);
            })
            .catch(function (error) {
              console.log(error);
            });
        }
        console.log(error);
      });
  }

  return children;
}
