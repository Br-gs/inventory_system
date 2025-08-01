import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import { authService } from '../api';
import toast from 'react-hot-toast';

const changePasswordSchema = z.object({
    old_password: z.string().min(1, 'Old password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters long'),
    new_password2: z.string(),
}).refine(data => data.new_password === data.new_password2, {
    message: "New passwords don't match",
    path: ['new_password2'],
});

const ChangepasswordForm = () => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            old_password: '',
            new_password: '',
            new_password2: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data) => {
        try {
            await authService.changePassword(data);
            toast.success('Password changed successfully');
            reset();
        } catch (error) {
            const apiErrors = error.response?.data;
            if (apiErrors) {
                Object.entries(apiErrors).forEach(([field, messages]) => {
                    const messageText = Array.isArray(messages) ? messages.join(' ') : messages;
                    toast.error(`${field}: ${messageText}`);
                });
            } else {
                toast.error('An error occurred while changing the password');
            }
        }
    };

    return ( 
        <form onSubmit={handleSubmit(onSubmit)} >
            <fieldset>
                <div>
                    <label htmlFor="old_password">Old Password</label>
                    <input
                        type="password"
                        id="old_password"
                        {...register('old_password')}
                    />
                    {errors.old_password && <p className="error">{errors.old_password.message}</p>}
                </div>
                <div>
                    <label htmlFor="new_password">New Password</label>
                    <input
                        type="password"
                        id="new_password"
                        {...register('new_password')}
                    />
                    {errors.new_password && <p className="error">{errors.new_password.message}</p>}
                </div>
                <div>
                    <label htmlFor="new_password2">Confirm New Password</label>
                    <input
                        type="password"
                        id="new_password2"
                        {...register('new_password2')}
                    />
                    {errors.new_password2 && <p className="error">{errors.new_password2.message}</p>}
                </div>
                <button type="submit">
                    {isSubmitting ? 'Updating...' : 'Updated Password'}
                </button>
            </fieldset>
        </form>
    );
};

export default ChangepasswordForm;