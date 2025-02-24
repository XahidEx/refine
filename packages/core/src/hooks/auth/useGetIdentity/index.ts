import {
    useQuery,
    UseQueryResult,
    UseQueryOptions,
} from "@tanstack/react-query";
import { getXRay } from "@refinedev/devtools-internal";

import { useAuthBindingsContext, useLegacyAuthContext } from "@contexts/auth";
import { IdentityResponse } from "../../../interfaces";
import { useKeys } from "@hooks/useKeys";

export type UseGetIdentityLegacyProps<TData> = {
    v3LegacyAuthProviderCompatible: true;
    queryOptions?: UseQueryOptions<TData>;
};

export type UseGetIdentityProps<TData = IdentityResponse> = {
    v3LegacyAuthProviderCompatible?: false;
    queryOptions?: UseQueryOptions<TData>;
};

export type UseGetIdentityCombinedProps<TData = any> = {
    v3LegacyAuthProviderCompatible: boolean;
    queryOptions?: UseQueryOptions<TData> | UseQueryOptions<IdentityResponse>;
};

export type UseGetIdentityLegacyReturnType<TData> = UseQueryResult<
    TData,
    unknown
>;

export type UseGetIdentityReturnType<TData = IdentityResponse> = UseQueryResult<
    TData,
    unknown
>;

export type UsePermissionsCombinedReturnType<TData = any> =
    | UseQueryResult<TData, unknown>
    | UseQueryResult<IdentityResponse, unknown>;

export function useGetIdentity<TData = any>(
    props: UseGetIdentityLegacyProps<TData>,
): UseGetIdentityLegacyReturnType<TData>;

export function useGetIdentity<TData = IdentityResponse>(
    props?: UseGetIdentityProps<TData>,
): UseGetIdentityReturnType<TData>;

export function useGetIdentity<TData = any>(
    props?: UseGetIdentityCombinedProps<TData>,
): UsePermissionsCombinedReturnType<TData>;

/**
 * `useGetIdentity` calls the `getUserIdentity` method from the {@link https://refine.dev/docs/core/providers/auth-provider `authProvider`} under the hood.
 *
 * @see {@link https://refine.dev/docs/api-reference/core/hooks/auth/useGetIdentity} for more details.
 *
 * @typeParam TData - Result data of the query
 *
 */
export function useGetIdentity<TData = any>({
    v3LegacyAuthProviderCompatible = false,
    queryOptions,
}: UseGetIdentityProps<TData> | UseGetIdentityLegacyProps<TData> = {}):
    | UseGetIdentityReturnType<TData>
    | UseGetIdentityLegacyReturnType<TData> {
    const { getUserIdentity: legacyGetUserIdentity } = useLegacyAuthContext();
    const { getIdentity } = useAuthBindingsContext();
    const { keys, preferLegacyKeys } = useKeys();

    const queryResponse = useQuery<TData>(
        keys().auth().action("identity").get(preferLegacyKeys),
        // Enabled check for `getIdentity` is enough to be sure that it's defined in the query function but TS is not smart enough to know that.
        (getIdentity as (params?: unknown) => Promise<TData>) ??
            (() => Promise.resolve({})),
        {
            enabled: !v3LegacyAuthProviderCompatible && !!getIdentity,
            retry: false,
            ...(v3LegacyAuthProviderCompatible === true ? {} : queryOptions),
            meta: {
                ...(v3LegacyAuthProviderCompatible === true
                    ? {}
                    : queryOptions?.meta),
                ...getXRay("useGetIdentity", preferLegacyKeys),
            },
        },
    );

    const legacyQueryResponse = useQuery<TData>(
        [
            ...keys().auth().action("identity").get(preferLegacyKeys),
            "v3LegacyAuthProviderCompatible",
        ],
        // Enabled check for `getUserIdentity` is enough to be sure that it's defined in the query function but TS is not smart enough to know that.
        legacyGetUserIdentity ?? (() => Promise.resolve({})),
        {
            enabled: v3LegacyAuthProviderCompatible && !!legacyGetUserIdentity,
            retry: false,
            ...(v3LegacyAuthProviderCompatible ? queryOptions : {}),
            meta: {
                ...(v3LegacyAuthProviderCompatible ? queryOptions?.meta : {}),
                ...getXRay("useGetIdentity", preferLegacyKeys),
            },
        },
    );

    return v3LegacyAuthProviderCompatible ? legacyQueryResponse : queryResponse;
}
