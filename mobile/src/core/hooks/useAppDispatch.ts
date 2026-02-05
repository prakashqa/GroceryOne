/**
 * Typed Redux hooks
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch } from '../../store/store';
import type { RootState } from '../../store/rootReducer';

/**
 * Typed useDispatch hook
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed useSelector hook
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
