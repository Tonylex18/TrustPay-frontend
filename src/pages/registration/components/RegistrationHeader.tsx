import Icon from '../../../components/AppIcon';

const RegistrationHeader = () => {
  return (
    <div className="mb-8 text-left">
      <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-14 h-14 bg-primary rounded-xl shadow-lg text-primary-foreground">
          <Icon name="UserPlus" size={28} color="white" />
        </div>
      </div>
      <h1 className="text-3xl font-semibold text-foreground mb-2">
        Create your TrustPay account
      </h1>
      <p className="text-muted-foreground text-base">
        Open a secure account to access payments, treasury, and wealth tools in one place.
      </p>
    </div>
  );
};

export default RegistrationHeader;
